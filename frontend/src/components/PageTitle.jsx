/** Keeps the browser tab title in step with the current page, e.g. "Log a fault · UFH Residence Maintenance". */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isStaff } from '../utils/roles.js';

const SITE = 'UFH Residence Maintenance';

function titleFor(path, staff) {
  if (path === '/login') return 'Sign in';
  if (path === '/register') return 'Create account';
  if (path === '/forgot-password' || path === '/reset-password') return 'Reset password';
  if (path === '/dashboard') return 'Dashboard';
  if (path === '/requests') return staff ? 'Work queue' : 'My requests';
  if (path === '/requests/new') return 'Log a fault';
  if (path.startsWith('/requests/')) return 'Request details';
  if (path === '/my-jobs') return 'My jobs';
  if (path === '/profile') return 'Profile';
  if (path === '/contact') return 'Contact us';
  if (path === '/terms') return 'Terms and conditions';
  if (path === '/privacy') return 'Privacy statement';
  return null;
}

export default function PageTitle() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const staff = isStaff(user);

  useEffect(() => {
    const page = titleFor(pathname, staff);
    document.title = page ? `${page} · ${SITE}` : SITE;
  }, [pathname, staff]);

  return null;
}
