import React from 'react';
import { useMap } from 'react-leaflet';
import './MapControls.css';

const MapControls = ({ currentStyle, setCurrentStyle, allPositions }) => {
    const map = useMap();

    const handleZoomIn = (e) => {
        e.stopPropagation();
        map.zoomIn();
    };

    const handleZoomOut = (e) => {
        e.stopPropagation();
        map.zoomOut();
    };

    const handleFitBounds = (e) => {
        e.stopPropagation();
        if (allPositions && allPositions.length > 0) {
            map.fitBounds(allPositions, { padding: [50, 50], maxZoom: 14 });
        }
    };

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
            {/* Zoom Controls */}
            <div className="controls-glass-panel zoom-controls">
                <button className="control-btn" onClick={handleZoomIn} title="Zoom In">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <div className="control-divider"></div>
                <button className="control-btn" onClick={handleZoomOut} title="Zoom Out">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <div className="control-divider"></div>
                <button className="control-btn" onClick={handleFitBounds} title="Fit to all markers">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6"/></svg>
                </button>
            </div>

            {/* Layer Styles */}
            <div className="controls-glass-panel">
                <span className="controls-title">Map Layers</span>
                <div className="style-switcher">
                    {styles.map((style) => (
                        <button
                            key={style.id}
                            className={`style-button ${currentStyle === style.id ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentStyle(style.id);
                            }}
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
