import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import './Demand.css';

// ─── Star Rating Component ───────────────────────────────
const StarRating = ({ rating, onRate, size = 18 }) => {
    const [hovered, setHovered] = useState(0);

    const renderStar = (index) => {
        const filled = hovered > 0 ? index <= hovered : index <= (rating || 0);
        return (
            <svg
                key={index}
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill={filled ? '#f59e0b' : 'none'}
                stroke={filled ? '#f59e0b' : '#cbd5e1'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="rating-star"
                style={{ cursor: onRate ? 'pointer' : 'default', transition: 'all 0.15s ease' }}
                onMouseEnter={() => onRate && setHovered(index)}
                onMouseLeave={() => onRate && setHovered(0)}
                onClick={(e) => {
                    e.stopPropagation();
                    onRate && onRate(index);
                }}
            >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        );
    };

    return (
        <div className="star-rating-container">
            <div className="star-rating-stars">
                {[1, 2, 3, 4, 5].map(i => renderStar(i))}
            </div>
            {rating != null && (
                <span className="star-rating-value">{Number(rating).toFixed(1)}</span>
            )}
        </div>
    );
};

const RatingBadge = ({ rating, onRate }) => {
    if (rating == null) {
        return (
            <div className="rating-badge not-rated">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Not Rated</span>
            </div>
        );
    }
    return <StarRating rating={rating} onRate={onRate} size={16} />;
};

const Demand = () => {
    const navigate = useNavigate();
    const [demands, setDemands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter and Sort States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('date'); // date, price, status, rating

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        maxPrice: '',
        currency: 'USD',
        quantity: '',
        quantityUnit: '',
        requiredBy: '',
        deliveryLocation: '',
        searchRadius: 50,
        description: '',
    });

    // Fetch demands from API on mount
    useEffect(() => {
        fetchDemands();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await api.get('/categories');
            if (Array.isArray(data)) {
                setCategories(data.map(c => c.category_name));
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchDemands = async () => {
        setIsLoading(true);
        try {
            const data = await api.get('/demand');
            setDemands(data.map(d => ({
                demandId: d.demand_id,
                uuid: `DEM-${d.demand_id}`,
                name: d.item_name,
                category: d.item_category,
                status: d.is_active ? 'active' : 'inactive',
                maxPrice: parseFloat(d.max_price_per_unit) || 0,
                currency: d.currency || 'USD',
                quantity: d.quantity || 0,
                quantityUnit: d.quantity_unit || '',
                requiredBy: d.required_by,
                deliveryLocation: d.delivery_location,
                searchRadius: d.search_radius || 50,
                description: d.item_description || '',
                rating: d.rating != null ? parseFloat(d.rating) : null
            })));
        } catch (err) {
            console.error('Failed to fetch demands:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRateDemand = async (demandId, newRating) => {
        try {
            await api.put(`/demand/${demandId}/rate`, { rating: newRating });
            // Update local state immediately for responsive UX
            setDemands(prev => prev.map(d => 
                d.demandId === demandId ? { ...d, rating: newRating } : d
            ));
        } catch (err) {
            console.error('Failed to rate demand:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                item_name: formData.name,
                item_category: formData.category, // Send Name string
                // category_id: null, // Let backend resolve it
                item_description: formData.description,
                max_price_per_unit: parseFloat(formData.maxPrice) || null,
                currency: formData.currency,
                quantity: parseFloat(formData.quantity) || null,
                quantity_unit: formData.quantityUnit,
                required_by: formData.requiredBy || null,
                delivery_location: formData.deliveryLocation || null,
                search_radius: parseFloat(formData.searchRadius) || 50,
            };
            await api.post('/demand', payload);
            setFormData({
                name: '', category: '', maxPrice: '', currency: 'USD',
                quantity: '', quantityUnit: '', requiredBy: '',
                deliveryLocation: '', searchRadius: 50, description: ''
            });
            fetchDemands(); // Refresh list
        } catch (err) {
            console.error('Failed to create demand:', err);
            alert('Failed to create demand. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getFilteredAndSortedDemands = () => {
        let filtered = demands.filter(demand => {
            const matchesSearch = (demand.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (demand.category || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || demand.status === filterStatus;
            const matchesCategory = filterCategory === 'all' || demand.category === filterCategory;
            return matchesSearch && matchesStatus && matchesCategory;
        });

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'price') return b.maxPrice - a.maxPrice;
            if (sortBy === 'status') return a.status.localeCompare(b.status);
            if (sortBy === 'rating') {
                if (a.rating == null && b.rating == null) return 0;
                if (a.rating == null) return 1;
                if (b.rating == null) return -1;
                return b.rating - a.rating;
            }
            return 0; // default 'date' keeps original order (newest first)
        });

        return filtered;
    };

    const uniqueCategories = [...new Set(demands.map(d => d.category))];

    return (
        <div className="demand-page-wrapper">
            <div className="demand-container">

                {/* History Section */}
                <div className="demand-history-column">
                    <div className="section-header">
                        <h2 className="demand-section-title">Demand History</h2>
                    </div>

                    <div className="filter-controls">
                        <div className="search-box">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search demands..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filter-row">
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
                                <option value="all">All Categories</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                                <option value="date">Sort by Date</option>
                                <option value="price">Sort by Price</option>
                                <option value="status">Sort by Status</option>
                                <option value="rating">Sort by Rating</option>
                            </select>
                        </div>
                    </div>

                    <div className="demand-history-list-container">
                        {getFilteredAndSortedDemands().map((demand) => (
                            <div key={demand.uuid} className="demand-item-card">
                                <div className="item-main-info">
                                    <div className="item-name-group">
                                        <div className="item-category-tag">{demand.category}</div>
                                        <h3 className="item-name">{demand.name}</h3>
                                    </div>
                                    <div className={`item-status-pill status-${demand.status}`}>
                                        {demand.status}
                                    </div>
                                </div>

                                {/* Rating Section */}
                                <div className="item-rating-section">
                                    <RatingBadge 
                                        rating={demand.rating} 
                                        onRate={(newRating) => handleRateDemand(demand.demandId, newRating)} 
                                    />
                                </div>

                                <div className="item-details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Reference ID</span>
                                        <span className="detail-value">{demand.uuid}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Max Price</span>
                                        <span className="detail-value">
                                            {{
                                                'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£',
                                                'JPY': '¥', 'AUD': 'A$', 'CAD': 'C$'
                                            }[demand.currency] || demand.currency}
                                            {(Number(demand.maxPrice) || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Quantity</span>
                                        <span className="detail-value">{demand.quantity} {demand.quantityUnit}</span>
                                    </div>
                                </div>

                                <div className="demand-card-actions">
                                    <button
                                        className="demand-action-btn find-matches-btn"
                                        onClick={() => navigate(`/demand/${demand.demandId}/match-map`)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                        Find Matching Supplies
                                    </button>
                                    <button
                                        className="demand-action-btn delete-btn"
                                        onClick={async () => {
                                            if(!window.confirm('Are you sure you want to delete this demand?')) return;
                                            try {
                                                await api.delete(`/demand/${demand.demandId}`);
                                                fetchDemands();
                                            } catch (err) {
                                                console.error('Failed to delete demand:', err);
                                            }
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create Section */}
                <div className="demand-create-column">
                    <div className="section-header">
                        <h2 className="demand-section-title">Create Demand</h2>
                    </div>

                    <form className="create-form-container" onSubmit={handleSubmit}>
                        <div className="form-scroll-content">
                            <div className="input-group">
                                <label className="input-label">Item Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="e.g. Emergency Response Kits"
                                    className="styled-input"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Item Category</label>
                                <select
                                    name="category"
                                    className="styled-input"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="" disabled>Select a category...</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-row">
                                <div className="input-group">
                                    <label className="input-label">Max Price per Unit</label>
                                    <input
                                        type="number"
                                        name="maxPrice"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="styled-input"
                                        value={formData.maxPrice}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Currency</label>
                                    <select name="currency" className="styled-input" value={formData.currency} onChange={handleInputChange} required>
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="INR">INR - Indian Rupee</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="GBP">GBP - British Pound</option>
                                        <option value="JPY">JPY - Japanese Yen</option>
                                        <option value="AUD">AUD - Australian Dollar</option>
                                        <option value="CAD">CAD - Canadian Dollar</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-row">
                                <div className="input-group">
                                    <label className="input-label">Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        step="0.01"
                                        placeholder="0"
                                        className="styled-input"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Quantity Unit</label>
                                    <select name="quantityUnit" className="styled-input" value={formData.quantityUnit} onChange={handleInputChange} required>
                                        <option value="">Select unit...</option>
                                        <option value="kg">kg - Kilograms</option>
                                        <option value="g">g - Grams</option>
                                        <option value="pieces">Pieces</option>
                                        <option value="litres">Litres</option>
                                        <option value="ml">ml - Millilitres</option>
                                        <option value="units">Units</option>
                                        <option value="boxes">Boxes</option>
                                        <option value="crates">Crates</option>
                                        <option value="kits">Kits</option>
                                    </select>
                                </div>
                            </div>

                             <div className="input-group radius-input-group">
                                <label className="input-label">
                                    Search Radius
                                    <span className="radius-value-badge">{formData.searchRadius} km</span>
                                </label>
                                <div className="radius-control">
                                    <input
                                        type="range"
                                        name="searchRadius"
                                        min="5"
                                        max="500"
                                        step="5"
                                        className="radius-slider"
                                        value={formData.searchRadius}
                                        onChange={handleInputChange}
                                    />
                                    <input
                                        type="number"
                                        name="searchRadius"
                                        min="5"
                                        max="500"
                                        className="styled-input radius-number"
                                        value={formData.searchRadius}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <span className="radius-hint">How far to search for matching supplies</span>
                            </div>

                            <div className="input-row">
                                <div className="input-group">
                                    <label className="input-label">Required By Date</label>
                                    <input
                                        type="date"
                                        name="requiredBy"
                                        className="styled-input"
                                        value={formData.requiredBy}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Delivery Location</label>
                                    <input
                                        type="text"
                                        name="deliveryLocation"
                                        placeholder="e.g. Mumbai, India"
                                        className="styled-input"
                                        value={formData.deliveryLocation}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Item Description</label>
                                <textarea name="description" placeholder="Describe the demand specifications..." className="styled-input styled-textarea" value={formData.description} onChange={handleInputChange} required />
                            </div>
                        </div>
                        <div className="supply-btn-container">
                            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                {isSubmitting ? 'Creating...' : 'Register Demand'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Demand;
