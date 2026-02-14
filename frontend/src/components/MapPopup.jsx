import React from 'react';
import './MapPopup.css';

const MapPopup = ({ data }) => {

    return (
        <div className="custom-popup-content">
            <div className="popup-header">
                <div className="org-info">
                    <h3 className="org-name">{data.orgName}</h3>
                    <p className="org-mail">{data.orgMail}</p>
                    <a href="#" className="more-details">more details →</a>
                </div>
            </div>

            <div className="contact-section">
                <p className="contact-name">{data.contactName}</p>
                <p className="contact-no">{data.contactNo}</p>
            </div>

            <div 
                className="item-details-card" 
            >
                <p className="item-name">{data.itemName}</p>
                <p className="item-category">{data.itemCategory}</p>
                <p className="item-price">Rs. {data.itemPrice} per unit</p>
            </div>

            <button 
                className="send-request-btn"
            >
                Send Request
            </button>
        </div>
    );
};

export default MapPopup;
