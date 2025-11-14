import React from 'react';
import { Routes, Route, Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Import Pages
import LandingPage from './pages/TravelerChatPage';
import HotelDashboardPage from './pages/HotelDashboardPage';
import AuthPage from './pages/AuthPage';
import PricingPage from './pages/PricingPage';
import TravelerUIPage from './pages/TravelerUIPage';
import HotelBookingPage from './pages/HotelBookingPage';
// Fix: Changed to a named import for Navbar to resolve the module resolution error.
import { Navbar } from './components/common/Navbar';

const App: React.FC = () => {
  return (
    <div className="font-sans antialiased bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                
                {/* Traveler Protected Route */}
                <Route element={<ProtectedRoute allowedRoles={['traveler']} />}>
                  <Route path="/chat" element={<TravelerUIPage />} />
                  <Route path="/book/:hotelId" element={<HotelBookingPage />} />
                </Route>
                
                {/* Hotel Manager Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['hotel']} />}>
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/dashboard" element={<HotelDashboardPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </div>
    </div>
  );
};

// Component to protect routes based on user role
const ProtectedRoute: React.FC<{ allowedRoles: Array<'traveler' | 'hotel'> }> = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>; // Or a spinner component
    }

    return user && allowedRoles.includes(user.type) ? <Outlet /> : <Navigate to="/auth" replace />;
};


const NotFound = () => (
    <div className="h-full flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg">
        <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
        <p className="text-lg mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="px-6 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors">
            Go to Homepage
        </Link>
    </div>
);


export default App;