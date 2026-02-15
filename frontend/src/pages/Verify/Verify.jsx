import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Verify.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const Verify = () => {
    const { token } = useParams();
    const [verifyResult, setVerifyResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (token) {
            verifyDeal();
        }
    }, [token]);

    const verifyDeal = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/deals/verify/${token}`);
            const data = await response.json();

            if (response.ok && data.verified) {
                setVerifyResult(data);
            } else {
                setError(data.error || 'Verification failed.');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="verify-page">
            <div className="verify-card">
                <div className="verify-logo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <h1>GENYSIS Verification</h1>
                </div>

                {isLoading ? (
                    <div className="verify-loading">
                        <div className="verify-spinner" />
                        <p>Verifying deal...</p>
                    </div>
                ) : error ? (
                    <div className="verify-error">
                        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        <h2>Verification Failed</h2>
                        <p>{error}</p>
                    </div>
                ) : verifyResult ? (
                    <div className="verify-success">
                        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <h2>Deal Verified ✓</h2>
                        <p className="verify-subtitle">This is an authentic GENYSIS platform deal.</p>

                        <div className="verify-details">
                            <div className="vd-row">
                                <span className="vd-label">Deal ID</span>
                                <span className="vd-value">DEAL-{verifyResult.deal.deal_id}</span>
                            </div>
                            <div className="vd-row">
                                <span className="vd-label">Supply</span>
                                <span className="vd-value">{verifyResult.deal.supply_name || 'N/A'}</span>
                            </div>
                            <div className="vd-row">
                                <span className="vd-label">Demand</span>
                                <span className="vd-value">{verifyResult.deal.demand_name || 'N/A'}</span>
                            </div>
                            <div className="vd-row">
                                <span className="vd-label">Supply Org</span>
                                <span className="vd-value">{verifyResult.deal.supply_org}</span>
                            </div>
                            <div className="vd-row">
                                <span className="vd-label">Demand Org</span>
                                <span className="vd-value">{verifyResult.deal.demand_org}</span>
                            </div>
                            <div className="vd-row">
                                <span className="vd-label">Status</span>
                                <span className="vd-value vd-status">{verifyResult.deal.status}</span>
                            </div>
                            <div className="vd-row">
                                <span className="vd-label">Created</span>
                                <span className="vd-value">{formatDate(verifyResult.deal.created_at)}</span>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Verify;
