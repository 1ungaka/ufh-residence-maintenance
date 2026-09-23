/** Site footer: who runs the portal, role-aware shortcuts, help and legal pages, and what to do in an emergency. */
import { Link } from 'react-router-dom';
import { Emblem } from './Ui.jsx';
import { CAMPUSES, UFH_LINKS } from '../utils/siteInfo.js';

const STUDENT_SHORTCUTS = [
  { to: '/requests/new', label: 'Log a fault' },
  { to: '/requests', label: 'My requests' },
  { to: '/profile', label: 'Profile' }
];

const MAINTENANCE_SHORTCUTS = [
  { to: '/requests', label: 'Work queue' },
  { to: '/my-jobs', label: 'My jobs' },
  { to: '/profile', label: 'Profile' }
];

// Shown when nobody is signed in (e.g. reading the privacy statement before registering).
const PUBLIC_SHORTCUTS = [
  { to: '/login', label: 'Sign in' },
  { to: '/register', label: 'Create a student account' }
];

// `href` links leave the portal (opened in a new tab); `to` links are pages in the app.
export const INFO_LINKS = [
  { href: UFH_LINKS.about, label: 'About us' },
  { to: '/contact', label: 'Contact us' },
  { to: '/terms', label: 'Terms and conditions' },
  { to: '/privacy', label: 'Privacy statement' }
];

export function InfoLink({ to, href, label }) {
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {label}
        <span className="sr-only"> (opens the UFH website in a new tab)</span>
      </a>
    );
  }
  return <Link to={to}>{label}</Link>;
}

function shortcutsFor(role) {
  if (role === 'student') return STUDENT_SHORTCUTS;
  if (role === 'maintenance') return MAINTENANCE_SHORTCUTS;
  return PUBLIC_SHORTCUTS;
}

export default function Footer({ role }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <Emblem size={64} />
          <div>
            <strong>Residence Maintenance Portal</strong>
            <span>Residence Life &amp; Facilities Management</span>
            <span>{CAMPUSES.join(' · ')}</span>
          </div>
        </div>

        <nav className="site-footer-col" aria-label="Shortcuts">
          <h4>Shortcuts</h4>
          {shortcutsFor(role).map(({ to, label }) => (
            <Link key={to} to={to}>{label}</Link>
          ))}
        </nav>

        <nav className="site-footer-col" aria-label="Help and legal">
          <h4>Help &amp; legal</h4>
          {INFO_LINKS.map((link) => (
            <InfoLink key={link.label} {...link} />
          ))}
        </nav>

        <div className="site-footer-col site-footer-alert">
          <h4>Urgent fault?</h4>
          <p>
            Burst pipes, flooding or exposed wiring: choose <strong>High</strong> urgency when you
            log it so it goes to the top of the queue.
          </p>
        </div>
      </div>

      <div className="site-footer-base">
        <span>&copy; {year} University of Fort Hare</span>
        <span>Together in Excellence</span>
      </div>
    </footer>
  );
}
