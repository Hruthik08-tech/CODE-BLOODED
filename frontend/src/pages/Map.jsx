import React, { useState } from 'react';
import {MapContainer, TileLayer, Popup, Marker, Polyline, useMapEvents} from 'react-leaflet';
import CustomMarker from '../components/CustomMarker.jsx';
import {mapStyles} from '../utils/mapStyles';
import MapControls from '../components/MapControls.jsx';
import MapPopup from '../components/MapPopup.jsx';

function ZoomHandler({ setZoomLevel }) {
    const map = useMapEvents({
        zoomend: () => {
            setZoomLevel(map.getZoom());
        },
    });
    return null;
}



const Map = () =>  {
    const markers = [
        { 
            id: 1, 
            latlng: [12.835230712705915, 77.69201222327615],
            orgName: "Alpha Logistics",
            orgMail: "alpha@logistics.com",
            contactName: "Vikram Rathore",
            contactNo: "+91 98765 43210",
            itemName: "Heavy Duty Crate",
            itemCategory: "Infrastructure",
            itemPrice: 185 // High price -> Brighter Red
        },
        { 
            id: 2, 
            latlng: [12.922915, 77.503384],
            orgName: "Eco Shelters",
            orgMail: "eco@shelters.org",
            contactName: "Ananya Sharma",
            contactNo: "+91 87654 32109",
            itemName: "Modular Bin",
            itemCategory: "Waste Management",
            itemPrice: 42 // Low price -> Lighter Red
        }
    ];

    const [currentStyle, setCurrentStyle] = useState('osm');
    const [zoomLevel, setZoomLevel] = useState(17);


    const markerPositions = markers.map(p => p.latlng)
    return (
        <div className="map-wrapper">
            
            <MapControls currentStyle={currentStyle} setCurrentStyle={setCurrentStyle} />
            
            <MapContainer center={[12.835230712705915, 77.69201222327615]} zoom={17} scrollWheelZoom={true} zoomControl = {false}>
                <ZoomHandler setZoomLevel={setZoomLevel} />
                <TileLayer
                    attribution={mapStyles[currentStyle].attribution}
                    url={mapStyles[currentStyle].url}
                />
            
            {zoomLevel > 11 && markers.map(marker => (
                <CustomMarker key={marker.id} position={marker.latlng}>
                    <Popup maxWidth={300}>
                        <MapPopup data={marker} />
                    </Popup>
                </CustomMarker>
            ))}

            {zoomLevel > 12 && (
                <Polyline 
                    positions={markerPositions}
                    pathOptions = {{color: '#3498db', 'weight': 2, className: 'floating-line'}}
                />
            )}
            </MapContainer>
        </div>
    )
}

export default Map;
