import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React from 'react';
import './index.css';

// Auth
import Register from './pages/Auth/Register.jsx';
import Login from './pages/Auth/Login.jsx';

// Layout
import AppLayout from './components/Layout/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Map from './pages/Map.jsx';
import OrganisationDashboard from './pages/OrganisationDashboard/index.jsx';
import Supply from './pages/Supply/Supply.jsx';
import Demand from './pages/Demand/Demand.jsx';
import MatchResults from './pages/MatchResults/MatchResults.jsx';
import Requests from './pages/Requests/Requests.jsx';
import RoomList from './pages/BusinessRoom/RoomList.jsx';
import BusinessRoom from './pages/BusinessRoom/BusinessRoom.jsx';
import Deals from './pages/Deals/Deals.jsx';
import DealBarcode from './pages/Deals/DealBarcode.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Notifications from './pages/Notifications/Notifications.jsx';
import Verify from './pages/Verify/Verify.jsx';

// Legacy
import NavBar from './components/NavBar.jsx';

// Helper: Route layout wrapper decides whether to use AppLayout or standalone
const AppRoutes = () => {
  const location = useLocation();

  // Public pages that do NOT use AppLayout
  const simplePublicPaths = ['/login', '/register', '/verify', '/map'];
  const isMatchMapRoute = /^\/(supply|demand)\/\d+\/match-map/.test(location.pathname);
  const isPublic = simplePublicPaths.some(p => location.pathname.startsWith(p)) || isMatchMapRoute;

  if (isPublic) {
    return (
      <>
        {(location.pathname === '/map' || location.pathname.includes('/match-map')) && <NavBar />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify/:token" element={<Verify />} />
          <Route path="/map" element={<Map />} />
          <Route path="/supply/:supplyId/match-map" element={<Map />} />
          <Route path="/demand/:demandId/match-map" element={<Map />} />
        </Routes>
      </>
    );
  }

  // Protected pages use AppLayout
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/organisation" element={<ProtectedRoute><OrganisationDashboard /></ProtectedRoute>} />
        <Route path="/supply" element={<ProtectedRoute><Supply /></ProtectedRoute>} />
        <Route path="/demand" element={<ProtectedRoute><Demand /></ProtectedRoute>} />
        <Route path="/match-results" element={<ProtectedRoute><MatchResults /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/rooms" element={<ProtectedRoute><RoomList /></ProtectedRoute>} />
        <Route path="/rooms/:id" element={<ProtectedRoute><BusinessRoom /></ProtectedRoute>} />
        <Route path="/business-room/:id" element={<ProtectedRoute><BusinessRoom /></ProtectedRoute>} />
        <Route path="/business-room" element={<ProtectedRoute><RoomList /></ProtectedRoute>} />
        <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
        <Route path="/deals/:dealId/barcode" element={<ProtectedRoute><DealBarcode /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </Router>
  )
}

export default App
