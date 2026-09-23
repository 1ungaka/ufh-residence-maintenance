/** Page frame: branded top bar, role-based side navigation, content area. */
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Emblem, Icons } from './Ui.jsx';
import Footer from './Footer.jsx';
import { portalRole } from '../utils/roles.js';

const STUDENT_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: Icons.dashboard },
  { to: '/requests', label: 'My requests', icon: Icons.list },
  { to: '/requests/new', label: 'Log a fault', icon: Icons.plus },
  { to: '/profile', label: 'Profile', icon: Icons.user }
];

const MAINTENANCE_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: Icons.dashboard },
  { to: '/requests', label: 'Work queue', icon: Icons.list },
  { to: '/my-jobs', label: 'My jobs', icon: Icons.tools },
  { to: '/profile', label: 'Profile', icon: Icons.user }
];

function initials(name) {
  const safeName = name || 'Student';
  return safeName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Safely extract Supabase metadata
  const meta = user?.user_metadata || {};
  const role = portalRole(user);
  const fullName = meta.full_name || 'Student';
  const residence = meta.residence_building || 'Residence';
  const room = meta.room_number || '';
  const trade = meta.trade || 'Facilities';

  const links = role === 'student' ? STUDENT_LINKS : MAINTENANCE_LINKS;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Emblem size={48} />
          <div className="brand-text">
            <div className="line1">
              <span className="brand-full">University of Fort Hare</span>
              <span className="brand-short" aria-hidden="true">UFH Residence</span>
            </div>
            <div className="line2">Residence Maintenance</div>
          </div>
        </div>

        <div className="user-chip">
          <div className="who">
            <strong>{fullName}</strong>
            <span>{role === 'student' ? `${residence} - ${room}` : trade}</span>
          </div>
          <div className="avatar" aria-hidden="true">{initials(fullName)}</div>
          <button type="button" className="btn-secondary btn-small" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar">
          <nav aria-label="Main">
            <p className="nav-label">{role === 'student' ? 'Residence' : 'Facilities'}</p>
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/requests'}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <Icon />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-help">
            <strong>Need help?</strong>
            Questions about a request or your account? <Link to="/contact">Contact us</Link>
          </div>
        </aside>

        <main className="content">
          {/* key forces the entrance animation to replay on each screen change */}
          <div className="content-inner rise" key={location.pathname}>
            {children}
          </div>
          <Footer role={role} />
        </main>
      </div>
    </div>
  );
}