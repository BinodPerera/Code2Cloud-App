import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Services from './pages/Services';
import Repos from './pages/Repos';
import ServiceSetup from './pages/ServiceSetup';
import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './components/DashboardLayout';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />
      
      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/services" replace />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:serviceId" element={<ServiceSetup />} />
          <Route path="/chat" element={
            <div style={{ textAlign: 'center', paddingTop: '10vh' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '700', background: 'linear-gradient(90deg, #fff, #a2a2b5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Chat coming soon
              </h2>
              <p style={{ color: '#a2a2b5', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                The AI assistant interface is currently under construction.
              </p>
            </div>
          } />
          <Route path="/repos" element={<Repos />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
