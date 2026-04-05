import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/send-payment', label: 'Send Payment' },
    { to: '/transactions', label: 'Transaction History' }
  ];

  return (
    <div className="app-shell">
      <header>
        <div>
          <h1>AI Payment App</h1>
          <p>Welcome, {user?.name || user?.email}</p>
        </div>
        <button className="secondary" onClick={logout}>Logout</button>
      </header>
      <nav>
        {links.map((link) => (
          <Link key={link.to} className={location.pathname === link.to ? 'active' : ''} to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  );
};

export default Layout;
