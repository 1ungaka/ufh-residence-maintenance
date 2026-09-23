/**
 * Routing.
 *
 * Every route below /dashboard is wrapped in RequireAuth, which sends anyone
 * without a valid session back to the login screen. Role-specific routes are
 * additionally guarded by RequireRole. (The backend enforces the same rules -
 * these guards are only there so the interface makes sense.)
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { Loading } from './components/Ui.jsx';
import { portalRole } from './utils/roles.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RequestList from './pages/RequestList.jsx';
import SubmitRequest from './pages/SubmitRequest.jsx';
import RequestDetail from './pages/RequestDetail.jsx';
import Profile from './pages/Profile.jsx';
import Contact from './pages/Contact.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import PublicLayout from './components/PublicLayout.jsx';
<<<<<<< HEAD
=======
import PageTitle from './components/PageTitle.jsx';
>>>>>>> e1ffca59a6f9db1e59e2fd35f5a3ed2d7d7cf2fd
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function RequireRole({ role, children }) {
  const { user } = useAuth();
  
  // Supabase stores custom registration data inside user_metadata
  if (portalRole(user) !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Loading..." />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// Info pages are readable by anyone; signed-in users keep their normal navigation.
function InfoPage({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Loading..." />;
  if (user) return <Layout>{children}</Layout>;
  return <PublicLayout>{children}</PublicLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/contact" element={<InfoPage><Contact /></InfoPage>} />
      {/* Not PublicOnly: a correct reset code signs the user in, and they must be
          allowed to carry on to /reset-password instead of being sent to the dashboard. */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<InfoPage><Terms /></InfoPage>} />
      <Route path="/privacy" element={<InfoPage><Privacy /></InfoPage>} />

      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/requests"
        element={
          <RequireAuth>
            <RequestList />
          </RequireAuth>
        }
      />
      <Route
        path="/requests/new"
        element={
          <RequireAuth>
            <RequireRole role="student">
              <SubmitRequest />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/requests/:id"
        element={
          <RequireAuth>
            <RequestDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/my-jobs"
        element={
          <RequireAuth>
            <RequireRole role="maintenance">
              <RequestList onlyMine />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageTitle />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}