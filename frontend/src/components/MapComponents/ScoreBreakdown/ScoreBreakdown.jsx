import React from 'react';

// Score Breakdown components

// Inline Styling 
const ScoreBreakdown = ({ breakdown, labels }) => {
    if (!breakdown) return null;

    const factors = [
        { 
            key: 'similarity', 
            label: 'Item Match', 
            icon: '🎯', 
            color: '#8b5cf6',
            weight: '40%'
        },
        { 
            key: 'price', 
            label: 'Price Fit', 
            icon: '💰', 
            color: '#10b981',
            weight: '25%'
        },
        { 
            key: 'distance', 
            label: 'Proximity', 
            icon: '📍', 
            color: '#3b82f6',
            weight: '20%'
        },
        { 
            key: 'quantity', 
            label: 'Quantity', 
            icon: '📦', 
            color: '#f59e0b',
            weight: '15%'
        },
    ];

    const getPriceLabel = (label) => {
        const map = {
            'under_budget': '✓ Under budget',
            'within_budget': '✓ Within budget',
            'very_affordable': '✓ Very affordable',
            'slightly_over': '~ Slightly over',
            'over_budget': '⚠ Over budget',
            'expensive': '✗ Expensive',
            'price_negotiable': '? Negotiable',
            'budget_unknown': '? No budget set',
        };
        return map[label] || '';
    };

    const getQuantityLabel = (label, pct) => {
        const map = {
            'full_fulfillment': `✓ Fully available`,
            'near_full': `~ ${pct}% available`,
            'partial': `⚠ ${pct}% available`,
            'low_partial': `⚠ Only ${pct}%`,
            'very_low': `✗ Only ${pct}%`,
            'incompatible_units': '? Different units',
        };
        return map[label] || '';
    };

    return (
        <div style={{
            margin: '6px 0 4px',
            padding: '6px 8px',
            background: 'rgba(0,0,0,0.03)',
            borderRadius: 8,
            fontSize: 11,
        }}>
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Score Breakdown
            </div>
            {factors.map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                    <span style={{ width: 14, textAlign: 'center', fontSize: 10 }}>{f.icon}</span>
                    <span style={{ width: 60, color: '#6b7280', fontSize: 10 }}>{f.label}</span>
                    <div style={{
                        flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.round((breakdown[f.key] || 0) * 100)}%`,
                            background: f.color,
                            borderRadius: 3,
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                    <span style={{ width: 28, textAlign: 'right', fontWeight: 600, fontSize: 10, color: '#374151' }}>
                        {Math.round((breakdown[f.key] || 0) * 100)}
                    </span>
                </div>
            ))}
            {/* Contextual labels */}
            <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {labels?.price && labels.price !== 'unknown' && (
                    <span style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 6,
                        background: labels.price.includes('under') || labels.price.includes('within') || labels.price.includes('affordable')
                            ? 'rgba(16,185,129,0.1)' : labels.price.includes('slightly')
                            ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                        color: labels.price.includes('under') || labels.price.includes('within') || labels.price.includes('affordable')
                            ? '#059669' : labels.price.includes('slightly')
                            ? '#d97706' : '#dc2626',
                    }}>
                        {getPriceLabel(labels.price)}
                    </span>
                )}
                {labels?.quantity && labels.quantity !== 'unknown' && (
                    <span style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 6,
                        background: labels.quantity.includes('full') ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: labels.quantity.includes('full') ? '#059669' : '#d97706',
                    }}>
                        {getQuantityLabel(labels.quantity, labels.fulfillment_pct)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ScoreBreakdown;