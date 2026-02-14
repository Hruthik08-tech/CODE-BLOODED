import React, { useState } from 'react';
import './OrganisationDashboard.css';
import OrgProfile from './OrgProfile.jsx';
import OrgDescription from './OrgDescription.jsx';


const OrganisationDashboard = () => {

    return (
        <div className="org-page-wrapper">
            <div className="org-dashboard-container">
                <div className="dashboard-header">
                    <div className="header-left">
                        <h1 className="org-title">Organisation Name</h1>
                        <span className="org-badge">Verified Partner</span>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="sidebar-column">
                        <OrgProfile />
                    </div>
                    <div className="content-column">
                        <div className="combined-details-box">
                            <div className="scrollable-details-content">
                                <OrgDescription />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganisationDashboard;
