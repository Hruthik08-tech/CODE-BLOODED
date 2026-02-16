import {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import './Supply.css';

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

const Supply = () => {
    const navigate = useNavigate();
    const [supplies, setSupplies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoadingSupplies, setIsLoadingSupplies] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter and Sort States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('date'); // date, price, status, rating
    const [supplierExpanded, setSupplierExpanded] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        currency: 'USD',
        quantity: '',
        quantityUnit: '',
        searchRadius: 50,
        expiryDate: '',
        supplierName: '',
        supplierContact: '',
        supplierEmail: '',
        description: ''
    });

    // Fetch supplies from API on mount
    useEffect(() => {
        fetchSupplies();
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

    const fetchSupplies = async () => {
        setIsLoadingSupplies(true);
        try {
            const data = await api.get('/supply');
            setSupplies(data.map(s => ({
                supplyId: s.supply_id,
                uuid: `SUP-${s.supply_id}`,
                name: s.item_name,
                category: s.item_category,
                status: s.is_active ? 'active' : 'inactive',
                price: parseFloat(s.price_per_unit) || 0,
                currency: s.currency || 'USD',
                quantity: s.quantity || 0,
                quantityUnit: s.quantity_unit || '',
                searchRadius: s.search_radius || 50,
                description: s.item_description || '',
                rating: s.rating != null ? parseFloat(s.rating) : null
            })));
        } catch (err) {
            console.error('Failed to fetch supplies:', err);
        } finally {
            setIsLoadingSupplies(false);
        }
    };

    const handleRateSupply = async (supplyId, newRating) => {
        try {
            await api.put(`/supply/${supplyId}/rate`, { rating: newRating });
            // Update local state immediately for responsive UX
            setSupplies(prev => prev.map(s => 
                s.supplyId === supplyId ? { ...s, rating: newRating } : s
            ));
        } catch (err) {
            console.error('Failed to rate supply:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                item_name: formData.name,
                item_category: formData.category,
                item_description: formData.description,
                price_per_unit: parseFloat(formData.price) || null,
                currency: formData.currency,
                quantity: parseFloat(formData.quantity) || null,
                quantity_unit: formData.quantityUnit,
                search_radius: parseFloat(formData.searchRadius) || 50,
                expiry_date: formData.expiryDate || null,
                supplier_name: formData.supplierName || null,
                supplier_contact: formData.supplierContact || null,
                supplier_email: formData.supplierEmail || null,
            };
            await api.post('/supply', payload);
            setFormData({
                name: '', category: '', price: '', currency: 'USD',
                quantity: '', quantityUnit: '', searchRadius: 50,
                expiryDate: '', supplierName: '', supplierContact: '',
                supplierEmail: '', description: ''
            });
            fetchSupplies(); // Refresh list
        } catch (err) {
            console.error('Failed to create supply:', err);
            alert('Failed to create supply. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter and Sort Logic
    const getFilteredAndSortedSupplies = () => {
        let filtered = supplies.filter(supply => {
            const matchesSearch = (supply.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 (supply.category || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || supply.status === filterStatus;
            const matchesCategory = filterCategory === 'all' || supply.category === filterCategory;
            return matchesSearch && matchesStatus && matchesCategory;
        });

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'price') {
                return b.price - a.price;
            } else if (sortBy === 'status') {
                return a.status.localeCompare(b.status);
            } else if (sortBy === 'rating') {
                // Items with ratings come first, then by rating value desc
                if (a.rating == null && b.rating == null) return 0;
                if (a.rating == null) return 1;
                if (b.rating == null) return -1;
                return b.rating - a.rating;
            }
            return 0; // default 'date' keeps original order (newest first)
        });

        return filtered;
    };

    const uniqueCategories = [...new Set(supplies.map(s => s.category))];

    return (
        <div className="supply-page-wrapper">
            <div className="supply-container">
                
                {/* History Section */}
                <div className="history-column">
                    <div className="section-header">
                        <h2 className="section-title">Supply History</h2>
                    </div>
                    
                    {/* Search and Filter Bar */}
                    <div className="filter-controls">
                        <div className="search-box">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <input 
                                type="text" 
                                placeholder="Search supplies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        
                        <div className="filter-row">
                            <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                            
                            <select 
                                value={filterCategory} 
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Categories</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="filter-select"
                            >
                                <option value="date">Sort by Date</option>
                                <option value="price">Sort by Price</option>
                                <option value="status">Sort by Status</option>
                                <option value="rating">Sort by Rating</option>
                            </select>
                        </div>
                    </div>

                    <div className="history-list-container">
                        {getFilteredAndSortedSupplies().map((supply) => (
                            <div key={supply.uuid} className="supply-item-card">
                                <div className="item-main-info">
                                    <div className="item-name-group">
                                        <div className="item-category-tag">{supply.category}</div>
                                        <h3 className="item-name">{supply.name}</h3>
                                    </div>
                                    <div className={`item-status-pill status-${supply.status}`}>
                                        {supply.status}
                                    </div>
                                </div>

                                {/* Rating Section */}
                                <div className="item-rating-section">
                                    <RatingBadge 
                                        rating={supply.rating} 
                                        onRate={(newRating) => handleRateSupply(supply.supplyId, newRating)} 
                                    />
                                </div>

                                <div className="item-details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Reference ID</span>
                                        <span className="detail-value">{supply.uuid}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Unit Price</span>
                                        <span className="detail-value">
                                            {{
                                                'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£', 
                                                'JPY': '¥', 'AUD': 'A$', 'CAD': 'C$'
                                            }[supply.currency] || supply.currency} 
                                            {(Number(supply.price) || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Quantity</span>
                                        <span className="detail-value">{supply.quantity} {supply.quantityUnit}</span>
                                    </div>
                                </div>

                                <div className="item-card-actions">
                                    <button 
                                        className="match-btn"
                                        onClick={() => navigate(`/supply/${supply.supplyId}/match-map`)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                        Find Matching Demands
                                    </button>
                                    <button 
                                        className="delete-item-btn"
                                        onClick={async () => {
                                            try {
                                                await api.delete(`/supply/${supply.supplyId}`);
                                                fetchSupplies();
                                            } catch (err) {
                                                console.error('Failed to delete supply:', err);
                                            }
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create Section */}
                <div className="create-column">
                    <div className="section-header">
                        <h2 className="section-title">Create Supply</h2>
                    </div>

                    <form className="create-form-container" onSubmit={handleSubmit}>
                        <div className="form-scroll-content">
                            <div className="input-group">
                                <label className="input-label">Item Name</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    placeholder="e.g. Solar Generators"
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
                                    <label className="input-label">Price per Unit</label>
                                    <input 
                                        type="number" 
                                        name="price" 
                                        step="0.01"
                                        placeholder="0.00"
                                        className="styled-input"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Currency</label>
                                    <select 
                                        name="currency" 
                                        className="styled-input"
                                        value={formData.currency}
                                        onChange={handleInputChange}
                                        required
                                    >
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
                                    <select 
                                        name="quantityUnit" 
                                        className="styled-input"
                                        value={formData.quantityUnit}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select unit...</option>
                                        <option value="kg">kg - Kilograms</option>
                                        <option value="g">g - Grams</option>
                                        <option value="pieces">Pieces</option>
                                        <option value="litres">Litres</option>
                                        <option value="ml">ml - Millilitres</option>
                                        <option value="units">Units</option>
                                        <option value="boxes">Boxes</option>
                                        <option value="crates">Crates</option>
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
                                <span className="radius-hint">How far to search for matching demands</span>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Expiry Date</label>
                                <input 
                                    type="date" 
                                    name="expiryDate" 
                                    className="styled-input"
                                    value={formData.expiryDate}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Item Description</label>
                                <textarea 
                                    name="description" 
                                    placeholder="Describe the supply specifications..."
                                    className="styled-input styled-textarea"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Supplier Details Section */}
                            <div className="supplier-section">
                                <div 
                                    className="supplier-header" 
                                    onClick={() => setSupplierExpanded(!supplierExpanded)}
                                >
                                    <h3 className="supplier-title">Supplier Details (Optional)</h3>
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        width="20" 
                                        height="20" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                        className={`chevron-icon ${supplierExpanded ? 'expanded' : ''}`}
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                                
                                {supplierExpanded && (
                                    <div className="supplier-content">
                                        <div className="input-group">
                                            <label className="input-label">Supplier Name</label>
                                            <input 
                                                type="text" 
                                                name="supplierName" 
                                                placeholder="e.g. MedSupply Co."
                                                className="styled-input"
                                                value={formData.supplierName}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        
                                        <div className="input-row">
                                            <div className="input-group">
                                                <label className="input-label">Contact Number</label>
                                                <input 
                                                    type="tel" 
                                                    name="supplierContact" 
                                                    placeholder="+1 234 567 8900"
                                                    className="styled-input"
                                                    value={formData.supplierContact}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Email Address</label>
                                                <input 
                                                    type="email" 
                                                    name="supplierEmail" 
                                                    placeholder="contact@supplier.com"
                                                    className="styled-input"
                                                    value={formData.supplierEmail}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="supply-btn-container">
                            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                {isSubmitting ? 'Creating...' : 'Register Supply'}
                            </button>
                        </div> 
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Supply;
