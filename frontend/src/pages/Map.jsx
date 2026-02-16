import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Popup, Polyline, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Import components 
import CustomMarker from '../components/CustomMarker.jsx';
import MapControls from '../components/MapControls.jsx';
import MapPopup from '../components/MapPopup.jsx';
import ScoreBreakdown from '../components/MapComponents/ScoreBreakdown/ScoreBreakdown.jsx';
import MatchResultsPanel from '../components/MapComponents/MatchResultsPanel/MatchResultsPanel.jsx';


// Import utils 
import { mapStyles } from '../utils/mapStyles';
import { api } from '../utils/api';

// Import context 
import { useAuth } from '../context/AuthContext';


// Colored Marker Icons using SVG data URIs
function createColoredIcon(color, size = 36) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${size}" height="${size * 1.5}">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.9"/>
    </svg>`;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [size, size * 1.5],
        iconAnchor: [size / 2, size * 1.5],
        popupAnchor: [0, -size * 1.2],
    });
}

const myOrgIcon = createColoredIcon('#F59E0B', 38);      // Gold/Amber for logged-in org
const dealPartnerIcon = createColoredIcon('#2364AA', 32); // Blue for deal partners
const matchOriginIcon = createColoredIcon('#10B981', 38); // Green for match origin
const orgIcon = createColoredIcon('#EA7317', 28);         // Orange for generic orgs

function ZoomHandler({ setZoomLevel }) {
    /* 
        This component used to store zoom values changes in a variable 
    */
    const map = useMapEvents({
        zoomend: () => {
            setZoomLevel(map.getZoom());
        },
    });
    return null;
}


function FitBounds({ positions }) {
    /*
        Auto-fit map bounds to all markers when data loads 
        Args:
            positions: Array of positions to fit bounds to 
    */
    const map = useMap();
    const hasAutoFitted = React.useRef(false);

    useEffect(() => {
        if (!positions || positions.length === 0) {
            hasAutoFitted.current = false;
            return;
        }

        if (!hasAutoFitted.current) {
            if (positions.length > 1) {
                map.fitBounds(positions, { padding: [50, 50], maxZoom: 14 });
                hasAutoFitted.current = true;
            } else if (positions.length === 1) {
                map.setView(positions[0], 13);
                hasAutoFitted.current = true;
            }
        }
    }, [positions, map]);
    return null;
}


// Score Breakdown Display Component moved to components/MapComponents/ScoreBreakdown/ScoreBreakdown.jsx


// Match Results Panel moved to components/MapComponents/MatchResultsPanel/MatchResultsPanel.jsx


const Map = () => {
    const { supplyId, demandId } = useParams(); // supplyId or demandId will be present
    const isDemandMode = !!demandId;
    const isSupplyMode = !!supplyId;
    const isMatchMode = isSupplyMode || isDemandMode;

    // Auth context for default (deal network) mode 
    const { user } = useAuth();

    // ── Deal network state (default mode) ──
    const [dealPartners, setDealPartners] = useState([]);
    const [networkLoading, setNetworkLoading] = useState(false);

    const [currentStyle, setCurrentStyle] = useState('osm');
    const [zoomLevel, setZoomLevel] = useState(17);

    // ── Match results state ──
    const [searchData, setSearchData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // ── All organisations state ──
    const [allOrganisations, setAllOrganisations] = useState([]);
    const [orgsLoading, setOrgsLoading] = useState(false);

    // ── Results panel ──
    const [showResultsPanel, setShowResultsPanel] = useState(true);

    // ── Send Request Modal ──
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [requestForm, setRequestForm] = useState({
        message: '',
    });
    const [requestSending, setRequestSending] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [requestError, setRequestError] = useState(null);

    // Fetch all organisations when in match mode
    useEffect(() => {
        if (!isMatchMode) return;
        const fetchOrganisations = async () => {
            setOrgsLoading(true);
            try {
                const data = await api.get('/organisations');
                setAllOrganisations(data);
            } catch (err) {
                console.error('Failed to fetch organisations:', err);
            } finally {
                setOrgsLoading(false);
            }
        };
        fetchOrganisations();
    }, [isMatchMode]);

    // ── Fetch deal partner network (default mode) ──
    useEffect(() => {
        if (isMatchMode) return;
        if (!user) return;
        const fetchDealNetwork = async () => {
            setNetworkLoading(true);
            try {
                const data = await api.get('/deals/map/partners');
                setDealPartners(data.partners || []);
            } catch (err) {
                console.error('Failed to fetch deal network:', err);
            } finally {
                setNetworkLoading(false);
            }
        };
        fetchDealNetwork();
    }, [isMatchMode, user]);

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

    // ── Handle Send Request Modal ──
    const openRequestModal = (marker) => {
        setSelectedMarker(marker);
        setRequestForm({ message: '' });
        setRequestSuccess(false);
        setRequestError(null);
        setShowRequestModal(true);
    };

    const closeRequestModal = () => {
        setShowRequestModal(false);
        setSelectedMarker(null);
        setRequestSuccess(false);
        setRequestError(null);
    };

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!selectedMarker) return;

        setRequestSending(true);
        setRequestError(null);

        try {
            const payload = {
                requested_to: selectedMarker.org_id,
                supply_id: isSupplyMode ? parseInt(supplyId) : (selectedMarker.supply_id || null),
                demand_id: isDemandMode ? parseInt(demandId) : (selectedMarker.demand_id || null),
                match_score: selectedMarker.match_score || null,
                supply_name_snapshot: selectedMarker.supply_name_snapshot || 
                    (isSupplyMode ? (searchData?.supply_item_name || `Supply #${supplyId}`) : selectedMarker.itemName) || null,
                demand_name_snapshot: selectedMarker.demand_name_snapshot || 
                    (isDemandMode ? (searchData?.demand_item_name || `Demand #${demandId}`) : selectedMarker.itemName) || null,
                message: requestForm.message || null,
            };

            await api.post('/requests', payload);
            setRequestSuccess(true);
        } catch (err) {
            console.error('Failed to send request:', err);
            setRequestError(err.message || 'Failed to send request');
        } finally {
            setRequestSending(false);
        }
    };

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
        itemName: isDemandMode ? (searchData.demand_item_name || `Demand #${searchData.demand_id}`) : (searchData.supply_item_name || `Supply #${searchData.supply_id}`),
        itemCategory: isDemandMode ? 'DEMAND ORIGIN' : 'SUPPLY ORIGIN',
        itemPrice: null,
        isOrigin: true,
    } : null;

    const matchOriginIcon = createColoredIcon('#10B981', 38); // Green for match origin
    const matchResultIcon = createColoredIcon('#2364AA', 32); // Blue for match results
    const orgIcon = createColoredIcon('#EA7317', 28);         // Orange for generic orgs

    // Match markers
    const matchMarkers = searchData
        ? searchData.results.map((r, idx) => ({
            id: `match-${r.id || idx}`,
            latlng: [r.org_latitude, r.org_longitude],
            orgName: r.org_name,
            orgMail: r.org_email || '',
            org_id: r.org_id,
            contactName: r.org_phone || '',
            contactNo: r.org_address || '',
            itemName: r.item_name,
            itemCategory: r.item_category || '',
            itemPrice: r.price || null,
            currency: r.currency || '',
            distance_km: r.distance_km,
            match_score: r.match_score,
            name_similarity: r.name_similarity,
            quantity: r.quantity,
            quantity_unit: r.quantity_unit,
            item_description: r.item_description,
            score_breakdown: r.score_breakdown,
            match_labels: r.match_labels,
            category_matched: r.category_matched,
            supply_id: r.supply_id || (isSupplyMode ? null : r.id),
            demand_id: r.demand_id || (isDemandMode ? null : r.id),
            supply_name_snapshot: isSupplyMode ? (searchData?.supply_item_name || `Supply #${supplyId}`) : r.item_name,
            demand_name_snapshot: isDemandMode ? (searchData?.demand_item_name || `Demand #${demandId}`) : r.item_name,
            isMatchResult: true,
        }))
        : [];

    // Organisation markers (all organisations except origin)
    const myOrgId = searchData 
        ? (isDemandMode ? searchData.demand_org_id : searchData.supply_org_id) 
        : null;
    
    const matchedOrgIds = new Set(matchMarkers.map(m => m.org_id));
    
    const orgMarkers = useMemo(() => {
        if (!isMatchMode) return [];
        return allOrganisations
            .filter(org => org.org_id !== myOrgId && !matchedOrgIds.has(org.org_id) && org.latitude && org.longitude)
            .map(org => ({
                id: `org-${org.org_id}`,
                latlng: [parseFloat(org.latitude), parseFloat(org.longitude)],
                orgName: org.org_name,
                orgMail: org.email || '',
                org_id: org.org_id,
                contactName: org.phone_number || '',
                contactNo: org.address || '',
                itemName: org.description ? org.description.substring(0, 50) + '...' : 'Organisation',
                itemCategory: `${org.city}, ${org.state}`,
                itemPrice: null,
                isOrganisation: true,
                city: org.city,
                state: org.state,
                country: org.country,
                website_url: org.website_url,
                description: org.description,
            }));
    }, [isMatchMode, allOrganisations, myOrgId, matchedOrgIds]);

    // ── Default Mode: Build markers from logged-in org + deal partners ──
    const myOrgMarker = useMemo(() => {
        if (isMatchMode || !user || !user.latitude || !user.longitude) return null;
        return {
            id: 'my-org',
            latlng: [parseFloat(user.latitude), parseFloat(user.longitude)],
            orgName: user.org_name,
            orgMail: user.email || '',
            org_id: user.org_id,
            contactName: user.phone_number || '',
            contactNo: user.address || '',
            itemName: user.description || user.org_name,
            itemCategory: [user.city, user.state].filter(Boolean).join(', '),
            itemPrice: null,
            isMyOrg: true,
        };
    }, [isMatchMode, user]);

    const dealPartnerMarkers = useMemo(() => {
        if (isMatchMode || !dealPartners.length) return [];
        return dealPartners
            .filter(p => p.latitude && p.longitude)
            .map(p => ({
                id: `deal-partner-${p.org_id}`,
                latlng: [parseFloat(p.latitude), parseFloat(p.longitude)],
                orgName: p.org_name,
                orgMail: p.email || '',
                org_id: p.org_id,
                contactName: p.phone || '',
                contactNo: p.address || '',
                itemName: p.description ? p.description.substring(0, 60) : p.org_name,
                itemCategory: [p.city, p.state].filter(Boolean).join(', '),
                itemPrice: null,
                isDealPartner: true,
                deals: p.deals || [],
                website_url: p.website_url,
                description: p.description,
            }));
    }, [isMatchMode, dealPartners]);

    const markers = useMemo(() => {
        return isMatchMode
            ? [originMarker, ...matchMarkers, ...orgMarkers].filter(Boolean)
            : [myOrgMarker, ...dealPartnerMarkers].filter(Boolean);
    }, [isMatchMode, originMarker, matchMarkers, orgMarkers, myOrgMarker, dealPartnerMarkers]);

    const defaultCenter = useMemo(() => {
        return isMatchMode && originMarker
            ? originMarker.latlng
            : myOrgMarker
            ? myOrgMarker.latlng
            : [12.835230712705915, 77.69201222327615];
    }, [isMatchMode, originMarker, myOrgMarker]);

    // All marker positions for polylines and bounds
    const allPositions = useMemo(() => markers.map(m => m.latlng), [markers]);

    // Polylines: connect origin to each match/deal-partner
    const polylinePositions = useMemo(() => {
        return isMatchMode && originMarker
            ? matchMarkers.map(m => [originMarker.latlng, m.latlng])
            : myOrgMarker
            ? dealPartnerMarkers.map(m => [myOrgMarker.latlng, m.latlng])
            : [];
    }, [isMatchMode, originMarker, matchMarkers, myOrgMarker, dealPartnerMarkers]);

    // Handle clicking a result in the panel
    const handleSelectMatch = (result) => {
        // This just scrolls to / highlights the marker on the map
    };

    return (
        <div className="map-wrapper">

            {/* ── Results Panel (sidebar) ── */}
            {isMatchMode && searchData && !isLoading && (
                <MatchResultsPanel
                    results={searchData.results}
                    isVisible={showResultsPanel}
                    onToggle={() => setShowResultsPanel(!showResultsPanel)}
                    isDemandMode={isDemandMode}
                    searchData={searchData}
                    onSelectMatch={handleSelectMatch}
                />
            )}

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
                    {allOrganisations.length > 0 && (
                        <span style={{
                            background: 'linear-gradient(135deg, #EA7317, #d66410)',
                            color: '#fff', padding: '3px 10px', borderRadius: 20,
                            fontSize: 11, fontWeight: 600,
                        }}>
                            🏢 {allOrganisations.length} orgs
                        </span>
                    )}
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

            {/* Deal network info badge (default mode) */}
            {!isMatchMode && myOrgMarker && dealPartnerMarkers.length > 0 && !networkLoading && (
                <div style={{
                    position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1000, background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)', padding: '10px 24px',
                    borderRadius: 30, fontFamily: 'var(--font-sans)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: '1px solid rgba(245,158,11,0.25)',
                }}>
                    <span style={{
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#fff', padding: '4px 12px', borderRadius: 20,
                        fontSize: 12, fontWeight: 700,
                    }}>
                        🌐 Your Network
                    </span>
                    <span style={{ fontSize: 13, color: '#2c3e50', fontWeight: 500 }}>
                        <strong>{dealPartnerMarkers.length}</strong> deal partner{dealPartnerMarkers.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Loading overlay for default mode */}
            {!isMatchMode && networkLoading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.8)', zIndex: 9999,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-sans)',
                }}>
                    <div style={{
                        width: 48, height: 48, border: '4px solid #e0e0e0',
                        borderTop: '4px solid #F59E0B', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ marginTop: 16, color: '#2c3e50', fontWeight: 600 }}>
                        Loading your deal network...
                    </p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            )}

            <MapContainer
                center={defaultCenter}
                zoom={isMatchMode ? 10 : (dealPartnerMarkers.length > 0 ? 10 : 13)}
                scrollWheelZoom={true}
                zoomControl={false}
                doubleClickZoom={true}
                dragging={true}
                animate={true}
            >
                <MapControls 
                    currentStyle={currentStyle} 
                    setCurrentStyle={setCurrentStyle} 
                    allPositions={allPositions}
                />
                <ZoomHandler setZoomLevel={setZoomLevel} />

                {/* Auto-fit bounds when data loads */}
                {allPositions.length > 1 && (
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
                {zoomLevel > (isMatchMode ? 4 : 3) && markers.map(marker => (
                    <CustomMarker
                        key={marker.id}
                        position={marker.latlng}
                        icon={
                            marker.isMyOrg ? myOrgIcon
                            : marker.isDealPartner ? dealPartnerIcon
                            : marker.isOrigin ? matchOriginIcon
                            : marker.isMatchResult ? matchResultIcon
                            : marker.isOrganisation ? orgIcon
                            : undefined
                        }
                    >
                        <Popup maxWidth={320}>
                            {marker.isMyOrg ? (
                                /* ── Logged-in Org Popup (Gold) ── */
                                <div className="custom-popup-content">
                                    <div className="popup-header">
                                        <div className="org-info">
                                            <h3 className="org-name">{marker.orgName}</h3>
                                            <p className="org-mail" style={{ color: '#D97706', fontWeight: 700 }}>
                                                ⭐ Your Organisation
                                            </p>
                                        </div>
                                    </div>
                                    <div className="item-details-card" style={{
                                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                    }}>
                                        <p className="item-name">{marker.orgName}</p>
                                        <p className="item-category">{marker.itemCategory}</p>
                                    </div>
                                    {marker.orgMail && (
                                        <p style={{ fontSize: 11, color: '#666', margin: '4px 0' }}>📧 {marker.orgMail}</p>
                                    )}
                                    {marker.contactName && (
                                        <p style={{ fontSize: 11, color: '#666', margin: '2px 0' }}>📞 {marker.contactName}</p>
                                    )}
                                </div>
                            ) : marker.isDealPartner ? (
                                /* ── Deal Partner Popup (Blue) ── */
                                <div className="custom-popup-content">
                                    <div className="popup-header">
                                        <div className="org-info">
                                            <h3 className="org-name">{marker.orgName}</h3>
                                            <p className="org-mail">{marker.orgMail}</p>
                                        </div>
                                    </div>
                                    <div className="item-details-card" style={{
                                        background: 'linear-gradient(135deg, #2364AA 0%, #1a4f8a 100%)',
                                    }}>
                                        <p className="item-name" style={{ fontSize: 12 }}>🤝 Deal Partner</p>
                                        <p className="item-category">{marker.itemCategory}</p>
                                    </div>
                                    {/* Show deals with this partner */}
                                    {marker.deals && marker.deals.length > 0 && (
                                        <div style={{ margin: '6px 0 2px' }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                                                Active Deals ({marker.deals.length})
                                            </div>
                                            {marker.deals.slice(0, 3).map((d, i) => (
                                                <div key={d.deal_id || i} style={{
                                                    padding: '5px 8px', margin: '3px 0',
                                                    background: 'rgba(35,100,170,0.06)',
                                                    borderRadius: 6, fontSize: 11,
                                                    borderLeft: `3px solid ${
                                                        d.deal_status === 'active' ? '#10b981'
                                                        : d.deal_status === 'completed' ? '#8b5cf6'
                                                        : '#f59e0b'
                                                    }`,
                                                }}>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                                        {d.supply_name || 'Supply'} ⇄ {d.demand_name || 'Demand'}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 2, color: '#64748b' }}>
                                                        {d.agreed_price != null && (
                                                            <span>💰 {d.currency || '₹'}{d.agreed_price}</span>
                                                        )}
                                                        {d.quantity != null && (
                                                            <span>📦 {d.quantity}</span>
                                                        )}
                                                        <span style={{
                                                            padding: '0 4px', borderRadius: 3, fontSize: 9, fontWeight: 600,
                                                            background: d.deal_status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                                                            color: d.deal_status === 'active' ? '#059669' : '#7c3aed',
                                                        }}>
                                                            {d.deal_status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {marker.deals.length > 3 && (
                                                <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 0', textAlign: 'center' }}>
                                                    +{marker.deals.length - 3} more deals
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {marker.contactName && (
                                        <p style={{ fontSize: 11, color: '#666', margin: '4px 0' }}>📞 {marker.contactName}</p>
                                    )}
                                </div>
                            ) : marker.isOrigin ? (
                                <div className="custom-popup-content">
                                    <div className="popup-header">
                                        <div className="org-info">
                                            <h3 className="org-name">{marker.orgName}</h3>
                                            <p className="org-mail" style={{ color: '#059669', fontWeight: 700 }}>
                                                📍 Your Organisation (Origin)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="item-details-card" style={{
                                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    }}>
                                        <p className="item-name">{marker.itemName}</p>
                                        <p className="item-category">{marker.itemCategory}</p>
                                    </div>
                                </div>
                            ) : marker.isOrganisation ? (
                                /* ── Organisation Marker Popup ── */
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
                                        </div>
                                    </div>
                                    <div className="item-details-card" style={{
                                        background: 'linear-gradient(135deg, #EA7317 0%, #d66410 100%)',
                                    }}>
                                        <p className="item-name" style={{ fontSize: 12 }}>🏢 Organisation</p>
                                        <p className="item-category">{marker.itemCategory}</p>
                                    </div>
                                    {marker.description && (
                                        <p style={{
                                            fontSize: 11, color: '#666', margin: '4px 0 2px',
                                            lineHeight: 1.4, fontStyle: 'italic',
                                        }}>
                                            {marker.description.length > 100 
                                                ? marker.description.substring(0, 100) + '...' 
                                                : marker.description}
                                        </p>
                                    )}
                                    {marker.website_url && (
                                        <a href={marker.website_url} target="_blank" rel="noopener noreferrer"
                                            style={{ fontSize: 11, color: '#2364AA', textDecoration: 'none' }}>
                                            🌐 {marker.website_url}
                                        </a>
                                    )}
                                    <button
                                        className="send-request-btn"
                                        onClick={() => openRequestModal(marker)}
                                    >
                                        Send Request
                                    </button>
                                </div>
                            ) : isMatchMode ? (
                                /* ── Match Marker Popup (Enhanced with Breakdown) ── */
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
                                                {isDemandMode 
                                                    ? `Price: ${marker.currency || '₹'}${marker.itemPrice}/unit` 
                                                    : `Max: ${marker.currency || '₹'}${marker.itemPrice}/unit`}
                                            </p>
                                        )}
                                        {marker.quantity && (
                                             <p style={{fontSize: 12, marginBottom: 0}}>
                                                Qty: {marker.quantity} {marker.quantity_unit}
                                             </p>
                                        )}
                                    </div>

                                    <ScoreBreakdown 
                                        breakdown={marker.score_breakdown} 
                                        labels={marker.match_labels} 
                                    />

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
                                        {marker.category_matched && (
                                            <span style={{
                                                background: 'rgba(139,92,246,0.1)', color: '#8b5cf6',
                                                padding: '3px 10px', borderRadius: 12,
                                                fontSize: 11, fontWeight: 600,
                                            }}>
                                                🏷️ Same Category
                                            </span>
                                        )}
                                    </div>

                                    {marker.item_description && (
                                        <p style={{
                                            fontSize: 11, color: '#666', margin: '6px 0 6px',
                                            lineHeight: 1.4, fontStyle: 'italic',
                                            borderLeft: '2px solid #eee', paddingLeft: '8px'
                                        }}>
                                            {marker.item_description}
                                        </p>
                                    )}
                                    <button
                                        className="send-request-btn"
                                        onClick={() => openRequestModal(marker)}
                                    >
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

            {/* ═══════════════════════════════════════════════════════ */}
            {/*  SEND REQUEST MODAL                                   */}
            {/* ═══════════════════════════════════════════════════════ */}
            {showRequestModal && selectedMarker && (
                <div className="request-modal-overlay" onClick={closeRequestModal}>
                    <div className="request-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="request-modal-header">
                            <div>
                                <h2 className="request-modal-title">Send Request</h2>
                                <p className="request-modal-subtitle">
                                    To <strong>{selectedMarker.orgName}</strong>
                                </p>
                            </div>
                            <button className="request-modal-close" onClick={closeRequestModal}>
                                ✕
                            </button>
                        </div>

                        {requestSuccess ? (
                            /* ── Success State ── */
                            <div className="request-modal-success">
                                <div className="success-icon">✓</div>
                                <h3>Request Sent!</h3>
                                <p>Your request has been sent to <strong>{selectedMarker.orgName}</strong>. 
                                   They will review it and respond soon.</p>
                                <button className="request-modal-btn" onClick={closeRequestModal}>
                                    Close
                                </button>
                            </div>
                        ) : (
                            /* ── Form ── */
                            <form onSubmit={handleSendRequest} className="request-modal-form">

                                {/* Requesting To */}
                                <div className="request-field-group">
                                    <label className="request-field-label">Requesting To</label>
                                    <div className="request-field-static">
                                        <span className="field-icon">🏢</span>
                                        <span>{selectedMarker.orgName}</span>
                                    </div>
                                </div>

                                {/* Supply & Demand Info Row */}
                                <div className="request-field-row">
                                    {/* Supply ID */}
                                    <div className="request-field-group">
                                        <label className="request-field-label">Supply</label>
                                        <div className="request-field-static">
                                            <span className="field-icon">📦</span>
                                            <span>
                                                {isSupplyMode 
                                                    ? `#${supplyId} — ${searchData?.supply_item_name || 'Your Supply'}`
                                                    : selectedMarker.itemName || 'N/A'
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    {/* Demand ID */}
                                    <div className="request-field-group">
                                        <label className="request-field-label">Demand</label>
                                        <div className="request-field-static">
                                            <span className="field-icon">📋</span>
                                            <span>
                                                {isDemandMode 
                                                    ? `#${demandId} — ${searchData?.demand_item_name || 'Your Demand'}`
                                                    : selectedMarker.itemName || 'N/A'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Match Score */}
                                {selectedMarker.match_score != null && (
                                    <div className="request-field-group">
                                        <label className="request-field-label">Match Score</label>
                                        <div className="request-match-score-bar">
                                            <div className="match-score-track">
                                                <div 
                                                    className="match-score-fill"
                                                    style={{ 
                                                        width: `${Math.round(selectedMarker.match_score * 100)}%`,
                                                        background: selectedMarker.match_score >= 0.7
                                                            ? 'linear-gradient(135deg, #27ae60, #2ecc71)'
                                                            : selectedMarker.match_score >= 0.4
                                                            ? 'linear-gradient(135deg, #f39c12, #e67e22)'
                                                            : 'linear-gradient(135deg, #e74c3c, #c0392b)',
                                                    }}
                                                />
                                            </div>
                                            <span className="match-score-value">
                                                {Math.round(selectedMarker.match_score * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Name Snapshots */}
                                <div className="request-field-row">
                                    <div className="request-field-group">
                                        <label className="request-field-label">Supply Snapshot</label>
                                        <div className="request-field-static small">
                                            {selectedMarker.supply_name_snapshot || 
                                                (isSupplyMode ? `Supply #${supplyId}` : selectedMarker.itemName) || '—'}
                                        </div>
                                    </div>
                                    <div className="request-field-group">
                                        <label className="request-field-label">Demand Snapshot</label>
                                        <div className="request-field-static small">
                                            {selectedMarker.demand_name_snapshot || 
                                                (isDemandMode ? `Demand #${demandId}` : selectedMarker.itemName) || '—'}
                                        </div>
                                    </div>
                                </div>

                                {/* Distance */}
                                {selectedMarker.distance_km != null && (
                                    <div className="request-field-group">
                                        <label className="request-field-label">Distance</label>
                                        <div className="request-field-static">
                                            <span className="field-icon">📏</span>
                                            <span>{selectedMarker.distance_km} km away</span>
                                        </div>
                                    </div>
                                )}

                                {/* Message */}
                                <div className="request-field-group">
                                    <label className="request-field-label">
                                        Message <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span>
                                    </label>
                                    <textarea
                                        id="request-message"
                                        className="request-textarea"
                                        placeholder="Add a message to introduce yourself or explain what you need..."
                                        value={requestForm.message}
                                        onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                                        rows={4}
                                    />
                                </div>

                                {/* Error */}
                                {requestError && (
                                    <div className="request-modal-error">
                                        ⚠️ {requestError}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="request-modal-actions">
                                    <button
                                        type="button"
                                        className="request-modal-btn secondary"
                                        onClick={closeRequestModal}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="request-modal-btn primary"
                                        disabled={requestSending}
                                    >
                                        {requestSending ? (
                                            <>
                                                <span className="btn-spinner" />
                                                Sending...
                                            </>
                                        ) : 'Send Request'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Map;
