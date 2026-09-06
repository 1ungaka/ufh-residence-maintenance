/** Page frame: branded top bar, role-based side navigation, content area. */
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Emblem, Icons } from './Ui.jsx';

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
  return name
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
  const links = user.role === 'student' ? STUDENT_LINKS : MAINTENANCE_LINKS;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Emblem size={34} />
          <div className="brand-text">
            <div className="line1">University of Fort Hare</div>
            <div className="line2">Residence Maintenance</div>
          </div>
        </div>

        <div className="user-chip">
          <div className="who">
            <strong>{user.name}</strong>
            <span>{user.role === 'student' ? `${user.residence} - ${user.room}` : user.trade}</span>
          </div>
          <div className="avatar" aria-hidden="true">{initials(user.name)}</div>
          <button type="button" className="btn-secondary btn-small" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar">
          <nav aria-label="Main">
            <p className="nav-label">{user.role === 'student' ? 'Residence' : 'Facilities'}</p>
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

          <div className="sidebar-foot">
            Residence Life &amp; Facilities Management
            <br />
            Alice &middot; East London &middot; Bhisho
          </div>
        </aside>

        <main className="content">
          {/* key forces the entrance animation to replay on each screen change */}
          <div className="content-inner rise" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
