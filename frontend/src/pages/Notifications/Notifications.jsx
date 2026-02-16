import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import './Notifications.css';

const Notifications = () => {
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const data = await api.get('/notifications');
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'request_received':
            case 'request_accepted':
            case 'request_rejected':
            case 'request_cancelled':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                );
            case 'new_message':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                );
            case 'deal_success':
            case 'deal_failed':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                );
            case 'room_status_changed':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                );
            case 'barcode_generated':
            case 'barcode_scanned':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="7" y1="7" x2="7" y2="17"/><line x1="10" y1="7" x2="10" y2="17"/><line x1="14" y1="7" x2="14" y2="17"/><line x1="17" y1="7" x2="17" y2="17"/></svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                );
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'request_received':
            case 'request_accepted':
            case 'request_rejected':
            case 'request_cancelled': 
                return 'request';
            case 'new_message': 
                return 'room';
            case 'deal_success':
            case 'deal_failed': 
                return 'deal';
            case 'room_status_changed':
                return 'room';
            case 'barcode_generated':
            case 'barcode_scanned':
                return 'deal';
            default: 
                return 'system';
        }
    };

    const formatTime = (iso) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const filteredNotifications = filter === 'all'
        ? notifications
        : filter === 'unread'
            ? notifications.filter(n => !n.is_read)
            : notifications.filter(n => getTypeLabel(n.type) === filter);

    return (
        <div className="notifications-page">
            <div className="notif-page-header">
                <div>
                    <h1 className="notif-page-title">Notifications</h1>
                    <p className="notif-page-subtitle">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="mark-all-btn" onClick={handleMarkAllRead}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="notif-filter-pills">
                {['all', 'unread', 'request', 'room', 'deal'].map(f => (
                    <button
                        key={f}
                        className={`notif-filter-pill ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="notif-list">
                {isLoading ? (
                    <div className="notif-empty">
                        <p>Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="notif-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        <p>No notifications found.</p>
                    </div>
                ) : (
                    filteredNotifications.map(notif => (
                        <div
                            key={notif.notification_id}
                            className={`notif-card ${notif.is_read ? 'read' : 'unread'}`}
                        >
                            <div className={`notif-card-icon notif-type-${getTypeLabel(notif.type)}`}>
                                {getTypeIcon(notif.type)}
                            </div>
                            <div className="notif-card-content">
                                <div className="notif-card-top-row">
                                    <h3 className="notif-card-title">{notif.title}</h3>
                                    <span className="notif-card-time">{formatTime(notif.created_at)}</span>
                                </div>
                                <p className="notif-card-message" dangerouslySetInnerHTML={{ __html: notif.message }} />
                            </div>
                            <div className="notif-card-actions">
                                {!notif.is_read && (
                                    <button
                                        className="notif-mark-btn"
                                        onClick={() => handleMarkRead(notif.notification_id)}
                                        title="Mark as read"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    </button>
                                )}
                                <button
                                    className="notif-delete-btn"
                                    onClick={() => handleDelete(notif.notification_id)}
                                    title="Delete"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
