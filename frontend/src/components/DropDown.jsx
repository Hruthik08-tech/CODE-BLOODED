
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DropDown.css';

const DropDown = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedType, setSelectedType] = useState('Demand');
    const navigate = useNavigate();
    
    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setDropdownOpen(false);
        if (type === 'Supply') {
            navigate('/supply');
        }
    };

    return (
        <div className="nav-dropdown-container">
            <button 
                className="nav-dropdown-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
            >
                {selectedType}
                <svg className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" width="16" height="16">
                    <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                </svg>
            </button>
            {dropdownOpen && (
                <div className="nav-dropdown-menu">
                    {['Demand', 'Supply', 'Request'].map((type) => (
                        <button 
                            key={type}
                            className={`nav-dropdown-item ${selectedType === type ? 'active' : ''}`}
                            onClick={() => handleTypeSelect(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DropDown;

