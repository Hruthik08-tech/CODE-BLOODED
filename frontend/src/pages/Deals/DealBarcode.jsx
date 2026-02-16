import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../utils/api';
import './DealBarcode.css';

const DealBarcode = () => {
    const { dealId: id } = useParams();
    const [deal, setDeal] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchDeal();
    }, [id]);

    const fetchDeal = async () => {
        setIsLoading(true);
        try {
            const data = await api.get(`/deals/${id}`);
            setDeal(data);
        } catch (err) {
            console.error('Failed to fetch deal:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const verificationUrl = deal?.qr_token
        ? `${window.location.origin}/verify/${deal.qr_token}`
        : '';

    const handleCopyLink = () => {
        if (verificationUrl) {
            navigator.clipboard.writeText(verificationUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="barcode-page">
                <p style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>Loading...</p>
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="barcode-page">
                <p style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>Deal not found.</p>
            </div>
        );
    }

    return (
        <div className="deal-barcode-page">
            <button className="back-btn" onClick={() => navigate('/deals')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Back to Deals
            </button>

            <div className="barcode-content">
                {/* QR Card */}
                <div className="barcode-card">
                    <div className="barcode-card-header-info">
                        <h1 className="barcode-card-title">Deal QR Code</h1>
                        <p className="barcode-card-subtitle">Scan to verify deal authenticity and details</p>
                    </div>

                    <div className="qr-code-container">
                        <div className="qr-frame">
                            {verificationUrl ? (
                                <QRCodeSVG
                                    value={verificationUrl}
                                    size={200}
                                    bgColor="#ffffff"
                                    fgColor="#2c3e50"
                                    level="H"
                                    includeMargin={false}
                                />
                            ) : (
                                <p>No QR data available.</p>
                            )}
                        </div>
                        <p className="qr-instruction">Use any standard QR scanner to verify this deal.</p>
                    </div>

                    {/* Verification Link Section */}
                    <div className="verify-link-section">
                        <label className="verify-link-label">Verification Link</label>
                        <div className="verify-link-box">
                            <span className="verify-link-text">{verificationUrl}</span>
                            <button className="copy-link-btn" onClick={handleCopyLink}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Deal Info Panel */}
                <div className="barcode-deal-info">
                    <h2 className="deal-info-title">Transaction Details</h2>
                    <div className="deal-info-list">
                        <div className="deal-info-item highlight">
                            <span className="deal-info-label">Deal Reference</span>
                            <span className="deal-info-value">#DEAL-{deal?.deal_id}</span>
                        </div>
                        <div className="deal-info-item">
                            <span className="deal-info-label">Current Status</span>
                            <span className={`deal-status-badge deal-status-${deal?.deal_status}`}>
                                {deal?.deal_status}
                            </span>
                        </div>
                        <div className="deal-info-item">
                            <span className="deal-info-label">Supply Item</span>
                            <span className="deal-info-value">{deal?.supply_name_snapshot || 'N/A'}</span>
                        </div>
                        <div className="deal-info-item">
                            <span className="deal-info-label">Demand Item</span>
                            <span className="deal-info-value">{deal?.demand_name_snapshot || 'N/A'}</span>
                        </div>
                        <div className="deal-info-item">
                            <span className="deal-info-label">Quantity</span>
                            <span className="deal-info-value">{deal?.quantity} {deal?.quantity_unit || 'units'}</span>
                        </div>
                        <div className="deal-info-item">
                            <span className="deal-info-label">Agreed Price</span>
                            <span className="deal-info-value">
                                {{ 'INR': '₹', 'USD': '$', 'EUR': '€' }[deal?.currency] || deal?.currency}
                                {Number(deal?.agreed_price || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="deal-info-item">
                            <span className="deal-info-label">Total Amount</span>
                            <span className="deal-info-value" style={{ color: 'var(--color-primary)' }}>
                                {{ 'INR': '₹', 'USD': '$', 'EUR': '€' }[deal?.currency] || deal?.currency}
                                {Number(deal?.total_value || (deal?.agreed_price * deal?.quantity) || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="deal-info-item">
                            <span className="deal-info-label">Date Finalized</span>
                            <span className="deal-info-value">{formatDate(deal?.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DealBarcode;
