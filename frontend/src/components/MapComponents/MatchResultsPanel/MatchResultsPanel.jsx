
import React, { useState } from 'react';

const MatchResultsPanel = ({ results, isVisible, onToggle, isDemandMode, searchData, onSelectMatch }) => {
    const [sortBy, setSortBy] = useState('score');

    if (!results || results.length === 0) return null;

    const sortedResults = [...results].sort((a, b) => {
        if (sortBy === 'score') return (b.match_score || 0) - (a.match_score || 0);
        if (sortBy === 'distance') return (a.distance_km || 999) - (b.distance_km || 999);
        if (sortBy === 'price') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'name') return (a.item_name || '').localeCompare(b.item_name || '');
        return 0;
    });

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={onToggle}
                style={{
                    position: 'absolute',
                    top: 140,
                    left: isVisible ? 360 : 0,
                    zIndex: 1001,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    color: '#2364AA',
                    border: '1px solid rgba(35, 100, 170, 0.2)',
                    borderRadius: isVisible ? '0 8px 8px 0' : '0 12px 12px 0',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '4px 0 15px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontFamily: 'var(--font-sans)',
                }}
            >
                {isVisible ? '✕' : `📋 ${results.length}`}
            </button>

            {/* Panel */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: isVisible ? 0 : -360,
                width: 360,
                height: '100%',
                zIndex: 1000,
                background: '#f8fafc',
                boxShadow: '10px 0 30px rgba(0,0,0,0.05)',
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'var(--font-sans)',
                borderRight: '1px solid rgba(0,0,0,0.05)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 20px 16px',
                    background: '#fff',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ 
                            width: 32, height: 32, borderRadius: 8, background: 'rgba(35, 100, 170, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                        }}>🔍</div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>
                            {isDemandMode ? 'Best Matches' : 'Supply Matches'}
                        </h3>
                    </div>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                        Matching for <strong>{searchData?.demand_item_name || searchData?.supply_item_name}</strong>
                    </p>

                    {/* Sort controls */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                            { key: 'score', label: '🏆 Best Fit' },
                            { key: 'distance', label: '� Nearest' },
                            { key: 'price', label: '💰 Price' },
                        ].map(s => (
                            <button
                                key={s.key}
                                onClick={() => setSortBy(s.key)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 100,
                                    border: '1px solid ' + (sortBy === s.key ? '#2364AA' : '#e2e8f0'),
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    background: sortBy === s.key ? '#2364AA' : '#fff',
                                    color: sortBy === s.key ? '#fff' : '#64748b',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
                    {sortedResults.map((r, idx) => (
                        <div
                            key={r.id || idx}
                            onClick={() => onSelectMatch(r)}
                            style={{
                                padding: '16px',
                                marginBottom: 12,
                                borderRadius: 16,
                                background: '#fff',
                                border: '1px solid rgba(0,0,0,0.04)',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#2364AA30';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 20px rgba(35,100,170,0.08)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                            }}
                        >
                            {/* Score Ring */}
                            <div style={{
                                position: 'absolute', top: 16, right: 16,
                                width: 44, height: 44, borderRadius: '50%',
                                background: r.match_score >= 0.7 ? '#ecfdf5' : r.match_score >= 0.4 ? '#fffbeb' : '#fef2f2',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                border: `1px solid ${r.match_score >= 0.7 ? '#10b98120' : r.match_score >= 0.4 ? '#f59e0b20' : '#ef444420'}`
                            }}>
                                <span style={{ 
                                    fontSize: 13, fontWeight: 900, 
                                    color: r.match_score >= 0.7 ? '#059669' : r.match_score >= 0.4 ? '#d97706' : '#dc2626'
                                }}>
                                    {Math.round(r.match_score * 100)}%
                                </span>
                                <span style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>Match</span>
                            </div>

                            <div style={{ paddingRight: 50 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: '#64748b', marginBottom: 2 }}>
                                    🏢 {r.org_name}
                                </div>
                                <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                                    {r.item_name}
                                </h4>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 12 }}>📍</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{r.distance_km} km</span>
                                    </div>
                                    {r.price != null && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12 }}>💰</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                                                {r.currency || '₹'}{r.price}
                                            </span>
                                        </div>
                                    )}
                                    {r.quantity != null && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12 }}>📦</span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                                                {r.quantity} {r.quantity_unit || ''}
                                            </span>
                                        </div>
                                    )}
                                    {r.category_matched && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12 }}>🏷️</span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>Verified</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default MatchResultsPanel;

