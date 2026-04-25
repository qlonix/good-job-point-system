import { useNavigate, useLocation } from 'react-router-dom';

export default function Header({ title, showBack = false, showAdmin = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="header">
      {showBack ? (
        <button className="header-back" onClick={() => navigate(-1)}>←</button>
      ) : (
        <span />
      )}
      <div className="header-title">
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
