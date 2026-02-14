import React from 'react';
import './MapControls.css';

const MapControls = ({ currentStyle, setCurrentStyle }) => {
    const styles = [
        { 
            id: 'osm', 
            label: 'Street', 
            color: '#2364AA', // Royal Blue
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/><path d="m17 7-5 5-5-5"/><path d="m17 17-5-5-5 5"/></svg>
            )
        },
        { 
            id: 'cartoLight', 
            label: 'Light', 
            color: '#3DA5D9', // Sky Blue
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            )
        }
    ];

    return (
        <div className="map-controls-container">
            <div className="controls-glass-panel">
                <span className="controls-title">Map Layers</span>
                <div className="style-switcher">
                    {styles.map((style) => (
                        <button
                            key={style.id}
                            className={`style-button ${currentStyle === style.id ? 'active' : ''}`}
                            onClick={() => setCurrentStyle(style.id)}
                            style={{ 
                                '--accent-color': style.color,
                                '--active-bg': `${style.color}15`
                            }}
                        >
                            <span className="style-icon">{style.icon}</span>
                            <span className="style-label">{style.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapControls;
