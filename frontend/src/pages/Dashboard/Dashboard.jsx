import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useActivity } from '../../context/activityContext.jsx';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const orgName = user?.org_name || 'My Organisation';
    const { stats, recentActivity, loading, error } = useActivity();

    const statsDisplay = [
        { 
            label: 'Active Supplies', 
            value: stats?.activeSupplies || 0, 
            color: '#2364AA',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
        },
        { 
            label: 'Active Demands', 
            value: stats?.activeDemands || 0, 
            color: '#EA7317',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 15h2"/><path d="M12 9v6"/><circle cx="12" cy="12" r="10"/></svg>
        },
        { 
            label: 'Pending Requests', 
            value: stats?.pendingRequests || 0, 
            color: '#73BFB8',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
        },
        { 
            label: 'Active Deals', 
            value: stats?.activeDeals || 0, 
            color: '#2f855a',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>
        },
    ];

    const quickActions = [
        { label: 'Create Supply', path: '/supply', color: '#2364AA', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        )},
        { label: 'Create Demand', path: '/demand', color: '#EA7317', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        )},
        { label: 'View Rooms', path: '/rooms', color: '#73BFB8', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
        )},
        { label: 'My Deals', path: '/deals', color: '#2f855a', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        )},
    ];

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "now";
    };

    if (loading) return <div className="dashboard-loading">Loading your dashboard...</div>;
    if (error) return <div className="dashboard-error">Error loading dashboard: {error.message}</div>;

    return (
        <div className="dashboard-page">
            <div className="dashboard-welcome">
                <div className="welcome-text">
                    <h1 className="welcome-title">Welcome back, <span className="welcome-org">{orgName}</span></h1>
                    <p className="welcome-subtitle">Here's what's happening with your supply-demand network today.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="dashboard-stats-grid">
                {statsDisplay.map((stat, i) => (   
                    <div key={i} className="stat-card" style={{ '--stat-color': stat.color }}>
                        <div className="stat-icon-wrapper">
                            {stat.icon}
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main content */}
            <div className="dashboard-main-grid">
                {/* Recent Activity */}
                <div className="dashboard-card activity-card">
                    <h3 className="card-title">Recent Activity</h3>
                    <div className="activity-list">
                        {recentActivity && recentActivity.length > 0 ? (
                            recentActivity.slice(0, 5).map(item => (
                                <div key={item.id} className="activity-item">
                                    <div className={`activity-dot dot-${item.type}`} />
                                    <div className="activity-content">
                                        <span className="activity-title">{item.title}</span>
                                        <span className="activity-desc" dangerouslySetInnerHTML={{ __html: item.desc }} />
                                    </div>
                                    <span className="activity-time">{timeAgo(item.time)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="no-activity">No recent activity found.</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-card quick-actions-card">
                    <h3 className="card-title">Quick Actions</h3>
                    <div className="quick-actions-grid">
                        {quickActions.map((action, i) => (
                            <button key={i} className="quick-action-btn" style={{ '--action-color': action.color }} onClick={() => navigate(action.path)}>
                                <span className="quick-action-icon">{action.icon}</span>
                                <span className="quick-action-label">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
