import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './context/AuthContext';

// Worker pages
import WorkerRegister from './pages/worker/Register';
import WorkerLogin from './pages/worker/Login';
import VerifyOTP from './pages/worker/VerifyOTP';
import WorkerDashboard from './pages/worker/Dashboard';
import KYCPage from './pages/worker/KYC';
import BuyPolicy from './pages/worker/BuyPolicy';
import SubmitClaim from './pages/worker/SubmitClaim';
import ClaimHistory from './pages/worker/ClaimHistory';
import ActivityLog from './pages/worker/ActivityLog';
import DynamicPremium from './pages/worker/DynamicPremium';
import ZeroTouchClaims from './pages/worker/ZeroTouchClaims';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClaimsTable from './pages/admin/ClaimsTable';
import FraudPanel from './pages/admin/FraudPanel';
import WorkerManagement from './pages/admin/WorkerManagement';
import DisruptionForm from './pages/admin/DisruptionForm';

// Platform pages
import PlatformLogin from './pages/platform/PlatformLogin';
import PlatformDashboard from './pages/platform/PlatformDashboard';
import WorkersTable from './pages/platform/WorkersTable';
import ClaimsFeed from './pages/platform/ClaimsFeed';

import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  const { loading } = useAuth();
  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-primary-600 animate-spin" />
        <span className="text-sm text-[var(--color-text-muted)] font-medium">Loading GigShield...</span>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        theme="light"
      />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/worker/login" replace />} />

        {/* Worker routes */}
        <Route path="/worker/register" element={<WorkerRegister />} />
        <Route path="/worker/login" element={<WorkerLogin />} />
        <Route path="/worker/verify-otp" element={<VerifyOTP />} />
        <Route path="/worker/dashboard" element={<ProtectedRoute role="worker"><WorkerDashboard /></ProtectedRoute>} />
        <Route path="/worker/kyc" element={<ProtectedRoute role="worker"><KYCPage /></ProtectedRoute>} />
        <Route path="/worker/buy-policy" element={<ProtectedRoute role="worker"><BuyPolicy /></ProtectedRoute>} />
        <Route path="/worker/submit-claim" element={<ProtectedRoute role="worker"><SubmitClaim /></ProtectedRoute>} />
        <Route path="/worker/claims" element={<ProtectedRoute role="worker"><ClaimHistory /></ProtectedRoute>} />
        <Route path="/worker/activity" element={<ProtectedRoute role="worker"><ActivityLog /></ProtectedRoute>} />
        <Route path="/worker/dynamic-premium" element={<ProtectedRoute role="worker"><DynamicPremium /></ProtectedRoute>} />
        <Route path="/worker/premium" element={<ProtectedRoute role="worker"><DynamicPremium /></ProtectedRoute>} />
        <Route path="/worker/zero-touch-claims" element={<ProtectedRoute role="worker"><ZeroTouchClaims /></ProtectedRoute>} />
        <Route path="/worker/zero-touch" element={<ProtectedRoute role="worker"><ZeroTouchClaims /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/claims" element={<ProtectedRoute role="admin"><ClaimsTable /></ProtectedRoute>} />
        <Route path="/admin/fraud" element={<ProtectedRoute role="admin"><FraudPanel /></ProtectedRoute>} />
        <Route path="/admin/workers" element={<ProtectedRoute role="admin"><WorkerManagement /></ProtectedRoute>} />
        <Route path="/admin/disruption" element={<ProtectedRoute role="admin"><DisruptionForm /></ProtectedRoute>} />

        {/* Platform routes */}
        <Route path="/platform/login" element={<PlatformLogin />} />
        <Route path="/platform/dashboard" element={<ProtectedRoute role="platform"><PlatformDashboard /></ProtectedRoute>} />
        <Route path="/platform/workers" element={<ProtectedRoute role="platform"><WorkersTable /></ProtectedRoute>} />
        <Route path="/platform/claims" element={<ProtectedRoute role="platform"><ClaimsFeed /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
