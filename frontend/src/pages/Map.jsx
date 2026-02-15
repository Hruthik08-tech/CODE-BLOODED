import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Popup, Polyline, Circle, useMapEvents, useMap } from 'react-leaflet';
import CustomMarker from '../components/CustomMarker.jsx';
import { mapStyles } from '../utils/mapStyles';
import MapControls from '../components/MapControls.jsx';
import MapPopup from '../components/MapPopup.jsx';
import { api } from '../utils/api';

function ZoomHandler({ setZoomLevel }) {
    const map = useMapEvents({
        zoomend: () => {
            setZoomLevel(map.getZoom());
        },
    });
    return null;
}

// Auto-fit map bounds to all markers when data loads
function FitBounds({ positions }) {
    const map = useMap();
    useEffect(() => {
        if (positions && positions.length > 1) {
            map.fitBounds(positions, { padding: [50, 50], maxZoom: 14 });
        } else if (positions && positions.length === 1) {
            map.setView(positions[0], 13);
        }
    }, [positions, map]);
    return null;
}


const Map = () => {
    const { supplyId, demandId } = useParams(); // supplyId or demandId will be present
    const isDemandMode = !!demandId;
    const isSupplyMode = !!supplyId;
    const isMatchMode = isSupplyMode || isDemandMode;

    // ── Static demo markers (when no ID) ──
    const staticMarkers = [
        {
            id: 1,
            latlng: [12.835230712705915, 77.69201222327615],
            orgName: "Alpha Logistics",
            orgMail: "alpha@logistics.com",
            contactName: "Vikram Rathore",
            contactNo: "+91 98765 43210",
            itemName: "Heavy Duty Crate",
            itemCategory: "Infrastructure",
            itemPrice: 185
        },
        {
            id: 2,
            latlng: [12.922915, 77.503384],
            orgName: "Eco Shelters",
            orgMail: "eco@shelters.org",
            contactName: "Ananya Sharma",
            contactNo: "+91 87654 32109",
            itemName: "Modular Bin",
            itemCategory: "Waste Management",
            itemPrice: 42
        }
    ];

    const [currentStyle, setCurrentStyle] = useState('osm');
    const [zoomLevel, setZoomLevel] = useState(17);

    // ── Match results state ──
    const [searchData, setSearchData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch search results when ID is present
    useEffect(() => {
        if (!isMatchMode) return;

        const fetchMatches = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const endpoint = isDemandMode 
                    ? `/demand/${demandId}/search`
                    : `/supply/${supplyId}/search`;
                
                const data = await api.get(endpoint);
                setSearchData(data);
            } catch (err) {
                console.error('Failed to fetch match results:', err);
                setError(err.message || 'Failed to load matches');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMatches();
    }, [supplyId, demandId, isDemandMode, isMatchMode]);

    // ── Build markers from search data ──

    // Origin marker
    const originMarker = searchData ? {
        id: 'origin',
        latlng: isDemandMode 
            ? [searchData.demand_org_lat, searchData.demand_org_lng]
            : [searchData.supply_org_lat, searchData.supply_org_lng],
        orgName: isDemandMode ? searchData.demand_org_name : searchData.supply_org_name,
        orgMail: '',
        contactName: 'Your Organisation',
        contactNo: '',
        itemName: isDemandMode ? `Demand #${searchData.demand_id}` : `Supply #${searchData.supply_id}`,
        itemCategory: isDemandMode ? 'DEMAND ORIGIN' : 'SUPPLY ORIGIN',
        itemPrice: null,
        isOrigin: true,
    } : null;

    // Match markers
    const matchMarkers = searchData
        ? searchData.results.map((r, idx) => ({
            id: `match-${r.id || idx}`,
            latlng: [r.org_latitude, r.org_longitude],
            orgName: r.org_name,
            orgMail: r.org_email || '',
            contactName: r.org_phone || '',
            contactNo: r.org_address || '',
            itemName: r.item_name,
            itemCategory: r.item_category || '',
            itemPrice: r.price || null,
            distance_km: r.distance_km,
            match_score: r.match_score,
            name_similarity: r.name_similarity,
            quantity: r.quantity,
            quantity_unit: r.quantity_unit,
            item_description: r.item_description,
        }))
        : [];

    const markers = isMatchMode
        ? [originMarker, ...matchMarkers].filter(Boolean)
        : staticMarkers;

    const defaultCenter = isMatchMode && originMarker
        ? originMarker.latlng
        : [12.835230712705915, 77.69201222327615];

    // All marker positions for polylines and bounds
    const allPositions = markers.map(m => m.latlng);

    // Polylines: connect origin to each match
    const polylinePositions = isMatchMode && originMarker
        ? matchMarkers.map(m => [originMarker.latlng, m.latlng])
        : [markers.map(m => m.latlng)]; // static mode: chain

    return (
        <div className="map-wrapper">

            <MapControls currentStyle={currentStyle} setCurrentStyle={setCurrentStyle} />

            {/* Loading overlay */}
            {isLoading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.8)', zIndex: 9999,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-sans)',
                }}>
                    <div style={{
                        width: 48, height: 48, border: '4px solid #e0e0e0',
                        borderTop: '4px solid #2364AA', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ marginTop: 16, color: '#2c3e50', fontWeight: 600 }}>
                        {isDemandMode ? 'Searching for matching supplies...' : 'Searching for matching demands...'}
                    </p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            )}

            {/* Error overlay */}
            {error && (
                <div style={{
                    position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, background: '#fff3f3', border: '1px solid #e74c3c',
                    padding: '12px 24px', borderRadius: 12, fontFamily: 'var(--font-sans)',
                    color: '#c0392b', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Match info badge */}
            {isMatchMode && searchData && !isLoading && (
                <div style={{
                    position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1000, background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)', padding: '10px 24px',
                    borderRadius: 30, fontFamily: 'var(--font-sans)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    display: 'flex', alignItems: 'center', gap: 16,
                    border: '1px solid rgba(35,100,170,0.15)',
                }}>
                    <span style={{
                        background: 'linear-gradient(135deg, #2364AA, #1a4f8a)',
                        color: '#fff', padding: '4px 12px', borderRadius: 20,
                        fontSize: 12, fontWeight: 700,
                    }}>
                        {searchData.total_results} matches
                    </span>
                    <span style={{ fontSize: 13, color: '#2c3e50', fontWeight: 500 }}>
                        within <strong>{searchData.search_radius_km} km</strong>
                    </span>
                    {searchData.cached && (
                        <span style={{
                            background: 'linear-gradient(135deg, #73BFB8, #5ba8a1)',
                            color: '#fff', padding: '3px 10px', borderRadius: 20,
                            fontSize: 11, fontWeight: 600,
                        }}>
                            ⚡ Cached ({Math.floor(searchData.cache_expires_in_seconds / 60)}m left)
                        </span>
                    )}
                </div>
            )}

            <MapContainer
                center={defaultCenter}
                zoom={isMatchMode ? 10 : 17}
                scrollWheelZoom={true}
                zoomControl={false}
            >
                <ZoomHandler setZoomLevel={setZoomLevel} />

                {/* Auto-fit bounds when match data loads */}
                {isMatchMode && allPositions.length > 0 && (
                    <FitBounds positions={allPositions} />
                )}

                <TileLayer
                    attribution={mapStyles[currentStyle].attribution}
                    url={mapStyles[currentStyle].url}
                />

                {/* Search radius circle around origin */}
                {isMatchMode && originMarker && searchData && (
                    <Circle
                        center={originMarker.latlng}
                        radius={searchData.search_radius_km * 1000}
                        pathOptions={{
                            color: '#2364AA',
                            weight: 1.5,
                            fillColor: '#2364AA',
                            fillOpacity: 0.04,
                            dashArray: '8, 6',
                        }}
                    />
                )}

                {/* Markers */}
                {zoomLevel > (isMatchMode ? 4 : 11) && markers.map(marker => (
                    <CustomMarker key={marker.id} position={marker.latlng}>
                        <Popup maxWidth={300}>
                            {marker.isOrigin ? (
                                <div className="custom-popup-content">
                                    <div className="popup-header">
                                        <div className="org-info">
                                            <h3 className="org-name">{marker.orgName}</h3>
                                            <p className="org-mail" style={{ color: '#2364AA', fontWeight: 700 }}>
                                                📍 Your Organisation (Origin)
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className="item-details-card"
                                        style={{
                                            background: 'linear-gradient(135deg, #2364AA 0%, #1a4f8a 100%)',
                                        }}
                                    >
                                        <p className="item-name">{marker.itemName}</p>
                                        <p className="item-category">{marker.itemCategory}</p>
                                    </div>
                                </div>
                            ) : isMatchMode ? (
                                <div className="custom-popup-content">
                                    <div className="popup-header">
                                        <div className="org-info">
                                            <h3 className="org-name">{marker.orgName}</h3>
                                            <p className="org-mail">{marker.orgMail}</p>
                                            {marker.contactName && (
                                                <p style={{ margin: '2px 0', fontSize: 12, color: '#555' }}>
                                                    📞 {marker.contactName}
                                                </p>
                                            )}
                                            {marker.contactNo && (
                                                <p style={{ margin: '2px 0', fontSize: 12, color: '#555' }}>
                                                    📍 {marker.contactNo}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="item-details-card">
                                        <p className="item-name">{marker.itemName}</p>
                                        <p className="item-category">{marker.itemCategory}</p>
                                        {marker.itemPrice != null && (
                                            <p className="item-price">
                                                {isDemandMode ? `Price: ₹${marker.itemPrice}/unit` : `Max: ₹${marker.itemPrice}/unit`}
                                            </p>
                                        )}
                                        {marker.quantity && (
                                             <p style={{fontSize: 12, marginBottom: 0}}>
                                                Qty: {marker.quantity} {marker.quantity_unit}
                                             </p>
                                        )}
                                    </div>
                                    <div style={{
                                        display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4,
                                    }}>
                                        <span style={{
                                            background: marker.match_score >= 0.7
                                                ? 'linear-gradient(135deg, #27ae60, #2ecc71)'
                                                : marker.match_score >= 0.4
                                                ? 'linear-gradient(135deg, #f39c12, #e67e22)'
                                                : 'linear-gradient(135deg, #e74c3c, #c0392b)',
                                            color: '#fff', padding: '3px 10px', borderRadius: 12,
                                            fontSize: 11, fontWeight: 700,
                                        }}>
                                            {Math.round(marker.match_score * 100)}% match
                                        </span>
                                        <span style={{
                                            background: 'rgba(35,100,170,0.1)', color: '#2364AA',
                                            padding: '3px 10px', borderRadius: 12,
                                            fontSize: 11, fontWeight: 600,
                                        }}>
                                            📏 {marker.distance_km} km
                                        </span>
                                    </div>
                                    {marker.item_description && (
                                        <p style={{
                                            fontSize: 11, color: '#666', margin: '6px 0 2px',
                                            lineHeight: 1.4, fontStyle: 'italic',
                                        }}>
                                            {marker.item_description}
                                        </p>
                                    )}
                                    <button className="send-request-btn">
                                        Send Request
                                    </button>
                                </div>
                            ) : (
                                <MapPopup data={marker} />
                            )}
                        </Popup>
                    </CustomMarker>
                ))}

                {/* Polylines */}
                {zoomLevel > (isMatchMode ? 4 : 12) && polylinePositions.map((positions, idx) => (
                    <Polyline
                        key={`polyline-${idx}`}
                        positions={positions}
                        pathOptions={{
                            color: isMatchMode ? '#2364AA' : '#3498db',
                            weight: isMatchMode ? 2.5 : 2,
                            opacity: 0.6,
                            dashArray: isMatchMode ? '10, 8' : null,
                            className: 'floating-line',
                        }}
                    />
                ))}
            </MapContainer>
        </div>
    );
};

export default Map;
