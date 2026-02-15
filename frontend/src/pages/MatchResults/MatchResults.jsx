import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import './MatchResults.css';

const MatchResults = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const sourceType = searchParams.get('type') || 'supply';
    const sourceId = searchParams.get('id');
    const sourceName = searchParams.get('name') || 'Listing';

    const [matches, setMatches] = useState([]);
    const [dismissed, setDismissed] = useState(new Set());
    const [saved, setSaved] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [sendingRequest, setSendingRequest] = useState(null);

    useEffect(() => {
        if (sourceId) {
            fetchMatches();
            fetchDismissed();
        }
    }, [sourceId, sourceType]);

    const fetchMatches = async () => {
        setIsLoading(true);
        try {
            const endpoint = sourceType === 'supply'
                ? `/supply/${sourceId}/search`
                : `/demand/${sourceId}/search`;
            const data = await api.get(endpoint);
            // data.results is an array of match objects from the backend
            setMatches(data.results || data || []);
        } catch (err) {
            console.error('Failed to fetch matches:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDismissed = async () => {
        try {
            const data = await api.get(`/matches/dismissed?source_type=${sourceType}&source_id=${sourceId}`);
            const dismissedIds = new Set(data.map(d => `${d.matched_type}-${d.matched_id}`));
            setDismissed(dismissedIds);
        } catch (err) {
            console.error('Failed to fetch dismissed:', err);
        }
    };

    const handleSave = async (match) => {
        const matchedType = sourceType === 'supply' ? 'demand' : 'supply';
        const matchedId = match.demand_id || match.supply_id;
        const key = `${matchedType}-${matchedId}`;

        try {
            await api.post('/matches/save', {
                source_type: sourceType,
                source_id: parseInt(sourceId),
                matched_type: matchedType,
                matched_id: matchedId,
                match_score: match.match_score || match.confidence_score,
                action: 'saved'
            });
            setSaved(prev => new Set([...prev, key]));
        } catch (err) {
            console.error('Failed to save match:', err);
        }
    };

    const handleDismiss = async (match) => {
        const matchedType = sourceType === 'supply' ? 'demand' : 'supply';
        const matchedId = match.demand_id || match.supply_id;
        const key = `${matchedType}-${matchedId}`;

        try {
            await api.post('/matches/save', {
                source_type: sourceType,
                source_id: parseInt(sourceId),
                matched_type: matchedType,
                matched_id: matchedId,
                match_score: match.match_score || match.confidence_score,
                action: 'dismissed'
            });
            setDismissed(prev => new Set([...prev, key]));
        } catch (err) {
            console.error('Failed to dismiss match:', err);
        }
    };

    const handleSendRequest = async (match) => {
        const matchedOrgId = match.org_id;
        if (!matchedOrgId) return;

        setSendingRequest(match.demand_id || match.supply_id);
        try {
            await api.post('/requests', {
                requested_to: matchedOrgId,
                supply_id: sourceType === 'supply' ? parseInt(sourceId) : (match.supply_id || null),
                demand_id: sourceType === 'demand' ? parseInt(sourceId) : (match.demand_id || null),
                match_score: match.match_score || match.confidence_score,
                supply_name_snapshot: sourceType === 'supply' ? sourceName : (match.item_name || null),
                demand_name_snapshot: sourceType === 'demand' ? sourceName : (match.item_name || null),
                message: `Interested in matching for ${sourceName}`
            });
            alert('Request sent successfully!');
        } catch (err) {
            console.error('Failed to send request:', err);
            alert('Failed to send request.');
        } finally {
            setSendingRequest(null);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'score-high';
        if (score >= 60) return 'score-medium';
        return 'score-low';
    };

    const visibleMatches = matches.filter(m => {
        const matchedType = sourceType === 'supply' ? 'demand' : 'supply';
        const matchedId = m.demand_id || m.supply_id;
        return !dismissed.has(`${matchedType}-${matchedId}`);
    });

    return (
        <div className="match-results-page">
            <div className="match-results-header">
                <div>
                    <h1 className="match-results-title">Match Results</h1>
                    <p className="match-results-subtitle">
                        AI-ranked matches for <strong>{sourceName}</strong>
                    </p>
                </div>
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
            </div>

            <div className="match-results-list">
                {isLoading ? (
                    <div className="match-empty">
                        <div className="match-spinner" />
                        <p>Searching for matches...</p>
                    </div>
                ) : visibleMatches.length === 0 ? (
                    <div className="match-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <p>No matches found.</p>
                    </div>
                ) : (
                    visibleMatches.map((match, idx) => {
                        const matchedType = sourceType === 'supply' ? 'demand' : 'supply';
                        const matchedId = match.demand_id || match.supply_id;
                        const key = `${matchedType}-${matchedId}`;
                        const isSaved = saved.has(key);
                        const score = match.match_score || match.confidence_score || 0;

                        return (
                            <div key={matchedId || idx} className={`match-card ${isSaved ? 'saved' : ''}`}>
                                <div className="match-card-top">
                                    <div className="match-rank">#{idx + 1}</div>
                                    <div className="match-info">
                                        <h3 className="match-item-name">{match.item_name}</h3>
                                        <span className="match-org-name">{match.org_name}</span>
                                        {match.item_description && (
                                            <p className="match-description">{match.item_description}</p>
                                        )}
                                    </div>
                                    <div className={`match-score-ring ${getScoreColor(score)}`}>
                                        <span className="score-value">{Math.round(score)}%</span>
                                    </div>
                                </div>

                                <div className="match-details-row">
                                    {match.price_per_unit && (
                                        <span className="match-detail">💰 {match.currency || '$'}{match.price_per_unit}</span>
                                    )}
                                    {match.max_price_per_unit && (
                                        <span className="match-detail">💰 Max: {match.currency || '$'}{match.max_price_per_unit}</span>
                                    )}
                                    {match.quantity && (
                                        <span className="match-detail">📦 {match.quantity} {match.quantity_unit || 'units'}</span>
                                    )}
                                    {match.item_category && (
                                        <span className="match-detail">🏷️ {match.item_category}</span>
                                    )}
                                </div>

                                {match.match_reason && (
                                    <p className="match-reason">💡 {match.match_reason}</p>
                                )}

                                <div className="match-card-actions">
                                    <button
                                        className={`match-action-btn save-match-btn ${isSaved ? 'active' : ''}`}
                                        onClick={() => handleSave(match)}
                                    >
                                        {isSaved ? '★ Saved' : '☆ Save'}
                                    </button>
                                    <button
                                        className="match-action-btn dismiss-match-btn"
                                        onClick={() => handleDismiss(match)}
                                    >
                                        ✕ Dismiss
                                    </button>
                                    <button
                                        className="match-action-btn send-request-btn"
                                        onClick={() => handleSendRequest(match)}
                                        disabled={sendingRequest === matchedId}
                                    >
                                        {sendingRequest === matchedId ? 'Sending...' : '📤 Send Request'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MatchResults;
