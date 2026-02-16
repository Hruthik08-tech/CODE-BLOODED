import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'request',
            title: 'New Request Received',
            message: 'Alpha Logistics sent a matching request for Medical Masks.',
            time: '5 min ago',
            read: false,
        },
        {
            id: 2,
            type: 'room',
            title: 'Business Room Created',
            message: 'A new room has been opened with Eco Shelters.',
            time: '1 hour ago',
            read: false,
        },
        {
            id: 3,
            type: 'deal',
            title: 'Deal Closed Successfully',
            message: 'Deal #D-4921 has been marked as successful.',
            time: '3 hours ago',
            read: true,
        },
        {
            id: 4,
            type: 'request',
            title: 'Request Accepted',
            message: 'Your request to Global Aid was accepted.',
            time: '1 day ago',
            read: true,
        },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'request':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                );
            case 'room':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                );
            case 'deal':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="notification-bell-wrapper" ref={dropdownRef}>
            <button className="bell-button" onClick={() => setIsOpen(!isOpen)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                    <span className="bell-badge">{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                        <h4>Notifications</h4>
                        {unreadCount > 0 && (
                            <button className="mark-all-read-btn" onClick={markAllRead}>
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="notification-list">
                        {notifications.slice(0, 10).map(notif => (
                            <div key={notif.id} className={`notification-item ${notif.read ? '' : 'unread'}`}>
                                <div className={`notif-icon notif-icon-${notif.type}`}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="notif-content">
                                    <span className="notif-title">{notif.title}</span>
                                    <span className="notif-message" dangerouslySetInnerHTML={{ __html: notif.message }} />
                                    <span className="notif-time">{notif.time}</span>
                                </div>
                                {!notif.read && <span className="notif-unread-dot" />}
                            </div>
                        ))}
                    </div>
                    <button className="view-all-btn" onClick={() => { setIsOpen(false); navigate('/notifications'); }}>
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
