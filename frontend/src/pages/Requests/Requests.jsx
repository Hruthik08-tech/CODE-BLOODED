import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import './Requests.css';

const Requests = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('received');
    const [sentRequests, setSentRequests] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const data = await api.get('/requests');
            setSentRequests(data.sent || []);
            setReceivedRequests(data.received || []);
        } catch (err) {
            console.error('Failed to fetch requests:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (id) => {
        try {
            await api.patch(`/requests/${id}/accept`);
            setReceivedRequests(prev =>
                prev.map(r => r.request_id === id ? { ...r, status: 'accepted' } : r)
            );
            setTimeout(() => {
                navigate('/rooms');
            }, 1000);
        } catch (err) {
            console.error('Failed to accept request:', err);
            alert('Failed to accept request.');
        }
    };

    const handleRejectClick = (id) => {
        setRejectingId(id);
    };

    const handleConfirmReject = async (id) => {
        try {
            await api.patch(`/requests/${id}/reject`, { rejection_reason: rejectionReason });
            setReceivedRequests(prev =>
                prev.map(r => r.request_id === id ? { ...r, status: 'rejected', rejection_reason: rejectionReason } : r)
            );
            setRejectingId(null);
            setRejectionReason('');
        } catch (err) {
            console.error('Failed to reject request:', err);
            alert('Failed to reject request.');
        }
    };

    const handleCancelReject = () => {
        setRejectingId(null);
        setRejectionReason('');
    };

    const handleOpenRoom = (request) => {
        navigate('/business-room');
    };

    const getStatusClass = (status) => `req-status-${status}`;

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const requests = activeTab === 'received' ? receivedRequests : sentRequests;
    const pendingCount = receivedRequests.filter(r => r.status === 'pending').length;

    return (
        <div className="requests-page">
            <div className="requests-header">
                <div className="requests-header-left">
                    <h1 className="requests-title">Requests</h1>
                    <p className="requests-subtitle">Manage incoming and outgoing match requests</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="requests-tabs">
                <button
                    className={`req-tab ${activeTab === 'received' ? 'active' : ''}`}
                    onClick={() => setActiveTab('received')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                    Received
                    {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
                </button>
                <button
                    className={`req-tab ${activeTab === 'sent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sent')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Sent
                </button>
            </div>

            {/* Request List */}
            <div className="requests-list">
                {isLoading ? (
                    <div className="requests-empty">
                        <p>Loading requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="requests-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <p>No {activeTab} requests yet.</p>
                    </div>
                ) : (
                    requests.map(request => (
                        <div key={request.request_id} className={`request-card ${request.status}`}>
                            <div className="request-card-top">
                                <div className="request-info">
                                    <div className="request-meta-row">
                                        <span className="request-type-tag">
                                            {request.supply_id ? 'supply' : 'demand'}
                                        </span>
                                        <span className="request-id">REQ-{request.request_id}</span>
                                        <span className="request-date">{formatDate(request.created_at)}</span>
                                    </div>
                                    <h3 className="request-item-name">
                                        {request.supply_name_snapshot || request.demand_name_snapshot || 'Listing'}
                                    </h3>
                                    <span className="request-org">
                                        {activeTab === 'received'
                                            ? `From: ${request.from_org_name}`
                                            : `To: ${request.to_org_name}`}
                                    </span>
                                </div>
                                <div className="request-right">
                                    {request.match_score && (
                                        <div className={`match-score-circle ${request.match_score >= 80 ? 'high' : request.match_score >= 60 ? 'medium' : 'low'}`}>
                                            <span className="score-number">{Math.round(request.match_score)}%</span>
                                            <span className="score-label">Match</span>
                                        </div>
                                    )}
                                    <span className={`request-status-badge ${getStatusClass(request.status)}`}>
                                        {request.status}
                                    </span>
                                </div>
                            </div>

                            {request.message && (
                                <p className="request-message">"{request.message}"</p>
                            )}

                            <div className="request-actions">
                                {activeTab === 'received' && request.status === 'pending' && (
                                    <div className="req-action-flow">
                                        {rejectingId === request.request_id ? (
                                            <div className="reject-reason-box">
                                                <textarea
                                                    className="reject-reason-input"
                                                    placeholder="Reason for rejection (required)..."
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                />
                                                <div className="reject-reason-btns">
                                                    <button 
                                                        className="confirm-reject-btn"
                                                        onClick={() => handleConfirmReject(request.request_id)}
                                                        disabled={!rejectionReason.trim()}
                                                    >
                                                        Confirm Reject
                                                    </button>
                                                    <button className="cancel-reject-btn" onClick={handleCancelReject}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <button className="req-action-btn accept-btn" onClick={() => handleAccept(request.request_id)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                    Accept
                                                </button>
                                                <button className="req-action-btn reject-btn" onClick={() => handleRejectClick(request.request_id)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                                {request.status === 'accepted' && (
                                    <button className="req-action-btn open-room-btn" onClick={() => handleOpenRoom(request)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                                        Open Business Room
                                    </button>
                                )}
                                {request.status === 'rejected' && (
                                    <div className="reject-note-display">
                                        <span className="request-rejected-note">This request has been declined.</span>
                                        {request.rejection_reason && (
                                            <p className="rejection-reason-text">Reason: {request.rejection_reason}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Requests;
