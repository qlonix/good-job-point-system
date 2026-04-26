import { useNavigate, useLocation } from 'react-router-dom';

export default function Header({ title, showAdmin = false, backTo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isChildDashboard = /^\/child\/[^/]+$/.test(location.pathname);
  const isAdmin = location.pathname.startsWith('/admin');

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
      return;
    }

    // If we're in admin
    if (isAdmin) {
      if (location.pathname === '/admin/dashboard') {
        navigate('/');
      } else {
        navigate('/admin/dashboard');
      }
      return;
    }
    
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="header">
      {!isHome ? (
        (isChildDashboard || location.pathname === '/admin/dashboard') ? (
          <button className="header-back" onClick={() => navigate(backTo || '/')} title="ホーム">🏠</button>
        ) : (
          <button className="header-back" onClick={handleBack}>←</button>
        )
      ) : (
        <span style={{ width: 44 }} />
      )}
      
      <div className="header-title" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        {!isAdmin && '⭐'} {title || 'がんばったねポイント'}
      </div>

      {showAdmin ? (
        <button className="btn-icon btn-outline" onClick={() => navigate('/admin')} title="管理画面">🔒</button>
      ) : (
        <span style={{ width: 44 }} />
      )}
    </div>
  );
}
