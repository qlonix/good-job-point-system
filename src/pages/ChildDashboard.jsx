import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Confetti from '../components/Confetti';
import { getChildById, getTotalPoints, getTasks, addPoints, getRewards, getCategories } from '../data/store';
import { renderRuby } from '../utils/format';

export default function ChildDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [success, setSuccess] = useState(null);

  const refreshChild = () => {
    const c = getChildById(id);
    if (!c) { navigate('/'); return; }
    setChild(c);
  };

  useEffect(() => { refreshChild(); }, [id]);

  if (!child) return null;

  const total = getTotalPoints(child);
  const categories = getCategories();
  const categorySum = categories.reduce((sum, c) => sum + (child.points[c.id] || 0), 0);
  const otherPoints = total - categorySum;

  const earnActions = categories.map((c) => ({
    key: c.id,
    emoji: c.emoji,
    label: renderRuby(c.name),
    gradient: `linear-gradient(135deg, ${c.color || '#9b7af7'}, #9b7af7)`
  }));
  
  const spendAction = { 
    key: 'reward', 
    emoji: '🎁', 
    label: renderRuby('[使(つか)]う'), 
    gradient: 'linear-gradient(135deg, var(--yellow), var(--orange))' 
  };
  
  const historyAction = { 
    key: 'history', 
    emoji: '📊', 
    label: renderRuby('[履歴(りれき)]'), 
    gradient: 'linear-gradient(135deg, #4fa8e0, #3498db)' 
  };

  const handleAction = (action) => {
    if (action.key === 'history') {
      navigate(`/child/${id}/history`);
    } else if (action.key === 'reward') {
      navigate(`/child/${id}/rewards`);
    } else {
      navigate(`/child/${id}/tasks/${action.key}`);
    }
  };

  return (
    <div className="page">
      <Header title="がんばったねポイント" showBack />

      {child.headerImage && (
        <div style={{
          margin: '0 -16px',
          aspectRatio: '1.5',
          backgroundImage: `url('${child.headerImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}></div>
      )}

      <div className="text-center" style={{ marginTop: child.headerImage ? '-50px' : 8, position: 'relative', zIndex: 2 }}>
        <div className="dashboard-avatar" style={child.headerImage ? { border: '4px solid white', background: 'white' } : {}}>
          {child.avatarImage ? (
            <img src={child.avatarImage} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <span className="emoji-xl">{child.avatar}</span>
          )}
        </div>
        <h1 className="dashboard-name">{renderRuby(child.name)}</h1>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="point-label">{renderRuby('[持(も)]っているポイント')}</div>
          <div className="point-total">{total}</div>
          <div className="point-label" style={{ marginBottom: otherPoints !== 0 ? 0 : 16 }}>ポイント</div>
          {otherPoints !== 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 4, marginBottom: 16 }}>
              ※カテゴリー集計外: {otherPoints} ポイント
            </div>
          )}

          <div className="point-categories">
            {categories.map((c) => (
              <div 
                key={c.id} 
                className="point-cat" 
                style={{ 
                  background: `${c.color || '#eee'}15`, 
                  border: `1px solid ${c.color || '#eee'}30`,
                  borderRadius: '12px'
                }}
              >
                <div className="point-cat-value" style={{ color: c.color || 'var(--text)' }}>
                  {child.points[c.id] || 0}
                </div>
                <div className="point-cat-label">
                  <span style={{ marginRight: 4 }}>{c.emoji}</span>
                  {renderRuby(c.name)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section-label">{renderRuby('ポイントをもらう')}</div>
        <div className="action-grid" style={{ marginTop: 0 }}>
          {earnActions.map((a) => (
            <button
              key={a.key}
              className="action-grid-btn"
              style={{ background: a.gradient, color: '#fff' }}
              onClick={() => handleAction(a)}
            >
              <span className="action-grid-emoji">{a.emoji}</span>
              <span className="action-grid-label">{a.label}</span>
            </button>
          ))}
        </div>

        <div className="dashboard-section-label">{renderRuby('ポイントを[使(つか)]う')}</div>
        <div className="action-grid" style={{ marginTop: 0, gridTemplateColumns: '1fr' }}>
          <button
            className="action-grid-btn"
            style={{ background: spendAction.gradient, color: 'var(--text)', minHeight: 80, flexDirection: 'row' }}
            onClick={() => handleAction(spendAction)}
          >
            <span className="action-grid-emoji">{spendAction.emoji}</span>
            <span className="action-grid-label" style={{ fontSize: '1.2rem' }}>{spendAction.label}</span>
          </button>
        </div>

        <div className="dashboard-section-label">{renderRuby('ポイントの[履歴(りれき)]を[見(み)]る')}</div>
        <div className="action-grid" style={{ marginTop: 0, gridTemplateColumns: '1fr', marginBottom: 40 }}>
          <button
            className="action-grid-btn"
            style={{ background: historyAction.gradient, color: '#fff', minHeight: 80, flexDirection: 'row' }}
            onClick={() => handleAction(historyAction)}
          >
            <span className="action-grid-emoji">{historyAction.emoji}</span>
            <span className="action-grid-label" style={{ fontSize: '1.2rem' }}>{historyAction.label}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
