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
        <div className="barcode-page">
            <div className="barcode-card">
                <div className="barcode-card-header">
                    <h1 className="barcode-title">Deal QR Code</h1>
                    <span className={`deal-status-badge deal-status-${deal.deal_status}`}>
                        {deal.deal_status}
                    </span>
                </div>

                <div className="qr-code-container">
                    {verificationUrl ? (
                        <QRCodeSVG
                            value={verificationUrl}
                            size={220}
                            bgColor="#ffffff"
                            fgColor="#2c3e50"
                            level="H"
                            includeMargin
                        />
                    ) : (
                        <p>No QR data available.</p>
                    )}
                </div>

                <div className="barcode-details">
                    <div className="barcode-detail-row">
                        <span className="bd-label">Deal ID</span>
                        <span className="bd-value">DEAL-{deal.deal_id}</span>
                    </div>
                    <div className="barcode-detail-row">
                        <span className="bd-label">Supply</span>
                        <span className="bd-value">{deal.supply_name_snapshot || 'N/A'}</span>
                    </div>
                    <div className="barcode-detail-row">
                        <span className="bd-label">Demand</span>
                        <span className="bd-value">{deal.demand_name_snapshot || 'N/A'}</span>
                    </div>
                    <div className="barcode-detail-row">
                        <span className="bd-label">Supply Org</span>
                        <span className="bd-value">{deal.supply_org_name || 'N/A'}</span>
                    </div>
                    <div className="barcode-detail-row">
                        <span className="bd-label">Demand Org</span>
                        <span className="bd-value">{deal.demand_org_name || 'N/A'}</span>
                    </div>
                    <div className="barcode-detail-row">
                        <span className="bd-label">Created</span>
                        <span className="bd-value">{formatDate(deal.created_at)}</span>
                    </div>
                </div>

                <div className="barcode-actions">
                    <div className="verification-link-row">
                        <input
                            type="text"
                            className="verification-link-input"
                            value={verificationUrl}
                            readOnly
                        />
                        <button className="copy-link-btn" onClick={handleCopyLink}>
                            {copied ? '✓ Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DealBarcode;
