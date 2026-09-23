/** Frame for the About, Contact, Terms and Privacy pages when nobody is signed in. */
import { Link, useLocation } from 'react-router-dom';
import { Emblem } from './Ui.jsx';
import Footer from './Footer.jsx';

export default function PublicLayout({ children }) {
  const location = useLocation();

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/login" className="brand brand-link">
          <Emblem size={48} />
          <div className="brand-text">
<<<<<<< HEAD
            <div className="line1">University of Fort Hare</div>
=======
            <div className="line1">
              <span className="brand-full">University of Fort Hare</span>
              <span className="brand-short" aria-hidden="true">UFH Residence</span>
            </div>
>>>>>>> e1ffca59a6f9db1e59e2fd35f5a3ed2d7d7cf2fd
            <div className="line2">Residence Maintenance</div>
          </div>
        </Link>

        <Link to="/login" className="topbar-signin">Sign in</Link>
      </header>

      <main className="content public-content">
        <div className="content-inner rise" key={location.pathname}>
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
