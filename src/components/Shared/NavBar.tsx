import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();

  return (
    <header style={{ padding: '1rem', borderBottom: '2px solid var(--line)', backgroundColor: '#fff' }}>
      <h1>⚡ FlowState</h1>
      <nav className="row">
        <Link to="/">
          <button className={location.pathname === '/' ? 'primary' : ''}>Home</button>
        </Link>
        <Link to="/feed">
          <button className={location.pathname === '/feed' ? 'primary' : ''}>Feed</button>
        </Link>
        <Link to="/resources">
          <button className={location.pathname === '/resources' ? 'primary' : ''}>Resources</button>
        </Link>
        <Link to="/quiz">
          <button className={location.pathname === '/quiz' ? 'primary' : ''}>Quiz</button>
        </Link>
      </nav>
    </header>
  );
}