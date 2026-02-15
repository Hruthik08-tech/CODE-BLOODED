import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import './RoomList.css';

const RoomList = () => {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setIsLoading(true);
        try {
            const data = await api.get('/rooms');
            setRooms(data);
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const statusLabels = {
        in_progress: 'In Progress',
        success: 'Closed — Successful',
        failed: 'Closed — Unsuccessful',
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'in_progress': return 'status-active';
            case 'success': return 'status-closed-success';
            case 'failed': return 'status-closed-fail';
            default: return '';
        }
    };

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins} min ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = (room.partner_org_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (room.supply_name_snapshot || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (room.demand_name_snapshot || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="room-list-page">
            <div className="room-list-header">
                <div>
                    <h1 className="room-list-title">Business Rooms</h1>
                    <p className="room-list-subtitle">Negotiate deals with matched organisations</p>
                </div>
            </div>

            <div className="room-list-controls">
                <div className="room-search-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search rooms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="room-filter-pills">
                    {['all', 'in_progress', 'success', 'failed'].map(status => (
                        <button
                            key={status}
                            className={`filter-pill ${filterStatus === status ? 'active' : ''}`}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status === 'all' ? 'All' : statusLabels[status]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="room-list-grid">
                {isLoading ? (
                    <div className="room-list-empty">
                        <p>Loading rooms...</p>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="room-list-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                        <p>No rooms found.</p>
                    </div>
                ) : (
                    filteredRooms.map(room => (
                        <div
                            key={room.room_id}
                            className="room-card"
                            onClick={() => navigate(`/business-room/${room.room_id}`)}
                        >
                            <div className="room-card-top">
                                <div className="room-avatar">
                                    {(room.partner_org_name || 'R').charAt(0)}
                                </div>
                                <div className="room-card-info">
                                    <h3 className="room-partner-name">{room.partner_org_name}</h3>
                                    <span className="room-item-name">
                                        {room.supply_name_snapshot || room.demand_name_snapshot || 'Deal'}
                                    </span>
                                </div>
                            </div>

                            {room.last_message && (
                                <p className="room-last-message">{room.last_message}</p>
                            )}

                            <div className="room-card-footer">
                                <span className={`room-status-badge ${getStatusClass(room.status)}`}>
                                    {statusLabels[room.status] || room.status}
                                </span>
                                <span className="room-time">
                                    {getTimeAgo(room.last_message_at || room.updated_at)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RoomList;
