import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import './Deals.css';

const Deals = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [deals, setDeals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        setIsLoading(true);
        try {
            const data = await api.get('/deals');
            setDeals(data);
        } catch (err) {
            console.error('Failed to fetch deals:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const stats = {
        total: deals.length,
        active: deals.filter(d => d.deal_status === 'active').length,
        completed: deals.filter(d => d.deal_status === 'completed').length,
    };

    const filtered = filter === 'all' ? deals : deals.filter(d => d.deal_status === filter);

    return (
        <div className="deals-page">
            <div className="deals-header">
                <div>
                    <h1 className="deals-title">Deals</h1>
                    <p className="deals-subtitle">Track and manage your supply-demand deals</p>
                </div>
            </div>

            {/* Stats */}
            <div className="deals-stats-row">
                <div className="deal-stat-card">
                    <span className="stat-number">{stats.total}</span>
                    <span className="stat-label">Total</span>
                </div>
                <div className="deal-stat-card active-stat">
                    <span className="stat-number">{stats.active}</span>
                    <span className="stat-label">Active</span>
                </div>
                <div className="deal-stat-card completed-stat">
                    <span className="stat-number">{stats.completed}</span>
                    <span className="stat-label">Completed</span>
                </div>
            </div>

            {/* Filters */}
            <div className="deals-filter-row">
                {['all', 'active', 'completed'].map(f => (
                    <button
                        key={f}
                        className={`deal-filter-btn ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Deal List */}
            <div className="deals-list">
                {isLoading ? (
                    <div className="deals-empty">
                        <p>Loading deals...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="deals-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        <p>No deals yet.</p>
                    </div>
                ) : (
                    filtered.map(deal => (
                        <div key={deal.deal_id} className="deal-card">
                            <div className="deal-card-top">
                                <div className="deal-info">
                                    <h3 className="deal-item-name">
                                        {deal.supply_name_snapshot || deal.demand_name_snapshot || 'Deal'}
                                    </h3>
                                    <span className="deal-partner">with {deal.partner_org_name}</span>
                                    <span className="deal-date">{formatDate(deal.created_at)}</span>
                                </div>
                                <span className={`deal-status-badge deal-status-${deal.deal_status}`}>
                                    {deal.deal_status}
                                </span>
                            </div>

                            <div className="deal-card-actions">
                                {deal.has_qr && (
                                    <button
                                        className="deal-action-btn qr-btn"
                                        onClick={() => navigate(`/deals/${deal.deal_id}/barcode`)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                        View QR Code
                                    </button>
                                )}
                                <button
                                    className="deal-action-btn room-btn"
                                    onClick={() => navigate(`/business-room/${deal.room_id}`)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                                    Open Room
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Deals;
