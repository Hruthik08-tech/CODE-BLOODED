import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NavBar.css';
import DropDown from './DropDown';

const NavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeItem, setActiveItem] = useState('organization');

    useEffect(() => {
        if (location.pathname === '/map') {
            setActiveItem('discover');
        } else if (location.pathname === '/organisation') {
            setActiveItem('organization');
        } else if (location.pathname === '/supply') {
            setActiveItem('warehouse');
        }
    }, [location.pathname]);

    const navItems = [
        { id: 'organization', label: 'Organization', color: '#73BFB8', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        )},
        { id: 'discover', label: 'Discover', color: '#3DA5D9', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        )},
        { id: 'warehouse', label: 'Warehouse', color: '#2364AA', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4"/><path d="M5 21V10.85"/><path d="M19 21V10.85"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>
        )},
        { id: 'room', label: 'Room', color: '#EA7317', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
        )},
    ];

    const handleClick = (item) => {
        setActiveItem(item.id);
        if (item.id === 'organization') {
            navigate('/organisation');
        } else if (item.id === 'discover') {
            navigate('/map');
        }
    };


    return (
        <nav className="custom-navbar-container">
            <div className="navbar-pill-box">
                {navItems.map((item) => (
                    <button 
                        key={item.id} 
                        className={`nav-item-pill ${activeItem === item.id ? 'active' : ''}`}
                        onClick={() => handleClick(item)}
                        style={{ 
                            '--item-color': item.color,
                            '--item-bg': `${item.color}20` // ~12% opacity
                        }}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </div>
            <DropDown />
            
        </nav>
    );
};

export default NavBar;
