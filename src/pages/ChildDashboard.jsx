import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Confetti from '../components/Confetti';
import ApprovalModal from '../components/ApprovalModal';
import { getChildById, getTotalPoints, getTasks, addPoints, getRewards } from '../data/store';

export default function ChildDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [showApproval, setShowApproval] = useState(null); // { action, label }
  const [success, setSuccess] = useState(null);

  const refreshChild = () => {
    const c = getChildById(id);
    if (!c) { navigate('/'); return; }
    setChild(c);
  };

  useEffect(() => { refreshChild(); }, [id]);

  if (!child) return null;

  const total = getTotalPoints(child);

  const ACTIONS = [
    { key: 'shukudai', emoji: '📝', label: 'しゅくだいをした', color: 'var(--blue)', gradient: 'linear-gradient(135deg, var(--blue), #4fa8e0)' },
    { key: 'okataduke', emoji: '🧹', label: 'おかたづけをした', color: 'var(--mint)', gradient: 'linear-gradient(135deg, var(--mint), #3db87a)' },
    { key: 'otetsudai', emoji: '🍽️', label: 'おてつだいをした', color: 'var(--purple)', gradient: 'linear-gradient(135deg, var(--purple), #9b7af7)' },
    { key: 'reward', emoji: '🎁', label: 'ポイントをつかう', color: 'var(--yellow)', gradient: 'linear-gradient(135deg, var(--yellow), var(--orange))' },
  ];

  const handleAction = (action) => {
    setShowApproval(action);
  };

  const handleApproved = (action) => {
    setShowApproval(null);
    if (action.key === 'reward') {
      navigate(`/child/${id}/rewards`);
    } else {
      // Find matching tasks and navigate to selection
      const categoryMap = { shukudai: 'obenkyo', okataduke: 'otetsudai', otetsudai: 'otetsudai' };
      navigate(`/child/${id}/tasks/${categoryMap[action.key]}`);
    }
  };

  return (
    <div className="page">
      <Header title="がんばったねポイント" showBack />

      <div className="text-center" style={{ marginTop: 8 }}>
        <div className="dashboard-avatar">
          {child.avatarImage ? (
            <img src={child.avatarImage} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          ) : (
            <span className="emoji-xl">{child.avatar}</span>
          )}
        </div>
        <h1 className="dashboard-name">{child.name}</h1>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="point-label">もっているポイント</div>
          <div className="point-total">{total}</div>
          <div className="point-label">ポイント</div>

          <div className="point-categories">
            <div className="point-cat otetsudai">
              <div className="point-cat-value">{child.points.otetsudai || 0}</div>
              <div className="point-cat-label">🧹 おてつだい</div>
            </div>
            <div className="point-cat obenkyo">
              <div className="point-cat-value">{child.points.obenkyo || 0}</div>
              <div className="point-cat-label">📚 おべんきょう</div>
            </div>
          </div>
        </div>

        <div className="action-grid">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              className="action-grid-btn"
              style={{ background: a.gradient, color: a.key === 'reward' ? 'var(--text)' : '#fff' }}
              onClick={() => handleAction(a)}
            >
              <span className="action-grid-emoji">{a.emoji}</span>
              <span className="action-grid-label">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {showApproval && (
        <ApprovalModal
          actionLabel={showApproval.label}
          actionEmoji={showApproval.emoji}
          childName={child.name}
          onApprove={() => handleApproved(showApproval)}
          onCancel={() => setShowApproval(null)}
        />
      )}
    </div>
  );
}
