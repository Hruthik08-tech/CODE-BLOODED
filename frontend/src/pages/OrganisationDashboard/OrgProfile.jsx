import React from 'react';

const OrgProfile = () => {
    return (
        <div className="org-profile-combined-box">
            <div className="org-image-container">
                <img 
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                    alt="Organization Building" 
                    className="org-image" 
                />
            </div>
            
            <div className="org-info-card">
                {/* Contact details on left, status on right */}
                <div className="contact-status-row">
                    <div className="contact-details-group">
                        <div className="info-group">
                            <p className="info-value">contact@organization.com</p>
                        </div>
                        
                        <div className="info-group">
                            <p className="info-value">+91 98765 43210</p>
                        </div>
                        
                        <div className="info-group">
                            <p className="info-value info-link">www.organization.com</p>
                        </div>
                    </div>
                    
                    <div className="status-group">
                        <span className="status-badge active">Active</span>
                    </div>
                </div>
                
                <div className="address-info-group-container">
                    <p className="info-value">123, Tech Park, Sector 4</p>
                    <div className="address-info-group">
                        <div className="address-field">
                            <span className="info-label info-label-address">City:</span>
                            <p className="info-value">Bangalore</p>
                        </div>
                        <div className="address-field">
                            <span className="info-label info-label-address">State:</span>
                            <p className="info-value">Karnataka</p>
                        </div>
                        <div className="address-field">
                            <span className="info-label info-label-address">Country:</span>
                            <p className="info-value">India</p>
                        </div>
                    </div>
                    <p className="info-value">560100</p>
                </div>
                
                <div className="info-footer">
                    created on: 12th Jan 2024
                </div>
            </div>
        </div>
    );
};

export default OrgProfile;
