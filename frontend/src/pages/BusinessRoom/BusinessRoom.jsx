import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './BusinessRoom.css';

const BusinessRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentOrgId = user?.org_id;

    /* ---- Room state ---- */
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    /* ---- Chat input state ---- */
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef(null);

    /* ---- Load room + messages ---- */
    useEffect(() => {
        if (id) {
            fetchRoom();
            fetchMessages();
        }
    }, [id]);

    const fetchRoom = async () => {
        try {
            const data = await api.get(`/rooms/${id}`);
            setRoom(data);
        } catch (err) {
            console.error('Failed to fetch room:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const data = await api.get(`/rooms/${id}/messages`);
            setMessages(data);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    /* ---- Auto-scroll to bottom on new message ---- */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /* ---- Helpers ---- */
    const formatDate = (iso) => {
        const d = new Date(iso);
        const day = d.getDate();
        const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3 || (day > 10 && day < 14)) ? 0 : day % 10] || 'th';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const formatTime = (iso) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatStatusLabel = (s) => {
        if (!s) return 'Created';
        return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    /* ---- Handlers ---- */
    const handleMarkStatus = async (status) => {
        try {
            const data = await api.patch(`/rooms/${id}/status`, { status });
            setRoom(prev => ({ ...prev, status }));
            if (status === 'success' && data.deal_id) {
                setTimeout(() => {
                    navigate(`/deals/${data.deal_id}/barcode`);
                }, 1000);
            }
        } catch (err) {
            console.error('Failed to update room status:', err);
            alert('Failed to update status.');
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;
        const content = messageInput.trim();
        setMessageInput('');

        // Optimistic add
        const tempMsg = {
            message_id: Date.now(),
            sender_org_id: currentOrgId,
            sender_name: user?.org_name || 'You',
            content,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            await api.post(`/rooms/${id}/messages`, { content });
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (isLoading) {
        return (
            <div className="room-page-wrapper">
                <p style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>Loading room...</p>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="room-page-wrapper">
                <p style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>Room not found.</p>
            </div>
        );
    }

    /* ===================================================
       RENDER
       =================================================== */
    return (
        <div className="room-page-wrapper">
            <div className="room-container">

                {/* =====================
                    LEFT PANEL
                    ===================== */}
                <div className="room-info-column">
                    <div className="room-info-card">

                        {/* Room header */}
                        <div className="room-header-block">
                            <div className="room-title-row">
                                <div className="room-names">
                                    <h2 className="room-supply-name">{room.supply_name_snapshot || 'Supply'}</h2>
                                    <span className="room-demand-name">{room.demand_name_snapshot || 'Demand'}</span>
                                </div>
                                <span className={`room-status-badge ${room.status}`}>
                                    {formatStatusLabel(room.status)}
                                </span>
                            </div>
                            <span className="room-created-at">created on: {formatDate(room.created_at)}</span>
                        </div>

                        {/* Scrollable middle */}
                        <div className="room-info-scroll">
                            <h3 className="room-section-title">Room Details</h3>
                            <div className="room-detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Partner</span>
                                    <span className="detail-value">{room.partner_org_name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Supply</span>
                                    <span className="detail-value">{room.supply_name_snapshot || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Demand</span>
                                    <span className="detail-value">{room.demand_name_snapshot || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deal controls — pinned at bottom */}
                        {room.status === 'in_progress' && (
                            <div className="change-status-section">
                                <h3 className="room-section-title">Finalize Deal</h3>
                                <div className="deal-action-buttons">
                                    <button
                                        className="confirm-status-btn deal-success-btn"
                                        onClick={() => handleMarkStatus('success')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        Mark as Successful
                                    </button>
                                    <button
                                        className="confirm-status-btn deal-fail-btn"
                                        onClick={() => handleMarkStatus('failed')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        Mark as Failed
                                    </button>
                                </div>
                            </div>
                        )}

                        {room.status === 'success' && (
                            <div className="change-status-section deal-closed-info">
                                <span className="deal-closed-badge success">✓ Deal Successful</span>
                                <p>QR code has been generated for this deal.</p>
                            </div>
                        )}

                        {room.status === 'failed' && (
                            <div className="change-status-section deal-closed-info">
                                <span className="deal-closed-badge failed">✗ Deal Failed</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* =====================
                    RIGHT PANEL — Chat
                    ===================== */}
                <div className="room-chat-column">
                    <div className="chat-header-bar">
                        <h2 className="room-section-title" style={{ marginBottom: 0 }}>Negotiation Chat</h2>
                    </div>

                    <div className="chat-body-card">
                        {/* Messages area */}
                        <div className="chat-messages-area">
                            {messages.length === 0 ? (
                                <div className="chat-empty-state">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isOwn = msg.sender_org_id === currentOrgId;

                                    return (
                                        <div key={msg.message_id} className={`chat-bubble ${isOwn ? 'own-message' : ''}`}>
                                            <div className="bubble-header">
                                                <span className="bubble-sender">{msg.sender_name}</span>
                                                <span className="bubble-timestamp">{formatTime(msg.created_at)}</span>
                                            </div>
                                            <p className="bubble-text">{msg.content}</p>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input bar */}
                        {room.status === 'in_progress' && (
                            <div className="chat-input-bar">
                                <input
                                    type="text"
                                    className="chat-text-input"
                                    placeholder="Type a message…"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                />
                                <button
                                    className="send-btn"
                                    onClick={handleSendMessage}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    Send
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BusinessRoom;
