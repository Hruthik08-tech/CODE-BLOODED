import React, { useState } from 'react';
import './Supply.css';

const Supply = () => {
    const [supplies, setSupplies] = useState([
        {
            uuid: 'SUP-4921-X82',
            name: 'Medical Masks (N95)',
            category: 'Healthcare',
            status: 'active',
            price: 2.50,
            quantity: 500,
            quantityUnit: 'pieces',
            description: 'High-grade N95 masks for emergency response teams.'
        },
        {
            uuid: 'SUP-7732-Q10',
            name: 'Energy Bars (Crate)',
            category: 'Food & Water',
            status: 'completed',
            price: 45.00,
            quantity: 20,
            quantityUnit: 'crates',
            description: 'Pack of 50 high-calorie energy bars for field workers.'
        },
        {
            uuid: 'SUP-2105-B44',
            name: 'Portable Water Filters',
            category: 'Sanitation',
            status: 'pending',
            price: 12.00,
            quantity: 100,
            quantityUnit: 'units',
            description: 'Individual water filtration units for disaster zones.'
        },
        {
            uuid: 'SUP-9981-L90',
            name: 'Thermal Blankets',
            category: 'Shelter',
            status: 'active',
            price: 8.50,
            quantity: 250,
            quantityUnit: 'pieces',
            description: 'Emergency space blankets for cold weather protection.'
        }, 
    ]);

    // Filter and Sort States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('date'); // date, price, status
    const [supplierExpanded, setSupplierExpanded] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        currency: 'USD',
        quantity: '',
        quantityUnit: '',
        expiryDate: '',
        supplierName: '',
        supplierContact: '',
        supplierEmail: '',
        description: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newSupply = {
            uuid: `SUP-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
            name: formData.name,
            category: formData.category,
            status: 'pending',
            price: parseFloat(formData.price),
            currency: formData.currency,
            quantity: parseFloat(formData.quantity),
            quantityUnit: formData.quantityUnit,
            expiryDate: formData.expiryDate,
            supplierName: formData.supplierName,
            supplierContact: formData.supplierContact,
            supplierEmail: formData.supplierEmail,
            description: formData.description
        };
        setSupplies([newSupply, ...supplies]);
        setFormData({ 
            name: '', 
            category: '', 
            price: '', 
            currency: 'USD', 
            quantity: '', 
            quantityUnit: '', 
            expiryDate: '',
            supplierName: '',
            supplierContact: '',
            supplierEmail: '',
            description: '' 
        });
    };

    // Filter and Sort Logic
    const getFilteredAndSortedSupplies = () => {
        let filtered = supplies.filter(supply => {
            const matchesSearch = supply.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 supply.category.toLowerCase().includes(searchQuery.toLowerCase());
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

                                <div className="item-details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Reference ID</span>
                                        <span className="detail-value">{supply.uuid}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Unit Price</span>
                                        <span className="detail-value">${supply.price.toFixed(2)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Quantity</span>
                                        <span className="detail-value">{supply.quantity} {supply.quantityUnit}</span>
                                    </div>
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
                                <input 
                                    type="text" 
                                    name="category" 
                                    placeholder="e.g. Energy"
                                    className="styled-input"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                />
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
                            <button type="submit" className="submit-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                Register Supply
                            </button>
                        </div> 
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Supply;
