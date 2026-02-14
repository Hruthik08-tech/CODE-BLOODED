import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import './index.css';
import Map from './pages/Map.jsx';
import OrganisationDashboard from './pages/OrganisationDashboard/index.jsx';
import Supply from './pages/Supply/Supply.jsx';
import NavBar from './components/NavBar.jsx';

function App() {
  return (
    <Router>
      <div className='app-container'>
        <NavBar />
        <Routes>
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="/map" element={<Map />} />
          <Route path="/organisation" element={<OrganisationDashboard />} />
          <Route path="/supply" element={<Supply />} />
        </Routes> 
      </div>
    </Router>
  )
}

export default App
