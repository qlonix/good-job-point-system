import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { getChildById, getTotalPoints, getCategories, getRewards, updateChild } from '../data/store';
import { renderRuby } from '../utils/format';

export default function ChildDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [localTargetId, setLocalTargetId] = useState(undefined);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const child = getChildById(id);

  useEffect(() => {
    if (!child) {
      navigate('/');
    }
  }, [child, navigate]);

  if (!child) return null;

  const total = getTotalPoints(child);
  const categories = getCategories();
  const rewards = getRewards();
  const categorySum = categories.reduce((sum, c) => sum + (child.points[c.id] || 0), 0);
  const otherPoints = total - categorySum;

  const activeTargetId = localTargetId !== undefined ? localTargetId : child.targetRewardId;
  const targetReward = rewards.find((r) => r.id === activeTargetId) || null;
  const targetCost = targetReward ? targetReward.cost : 0;
  const progressPercent = targetCost > 0 ? Math.min(100, Math.round((total / targetCost) * 100)) : 0;
  const isGoalReached = targetReward && total >= targetReward.cost;
  const shortage = targetReward ? Math.max(0, targetReward.cost - total) : 0;

  const handleSetGoal = async (rewardId) => {
    await updateChild(id, { targetRewardId: rewardId });
    setLocalTargetId(rewardId);
    setShowGoalModal(false);
  };

  const earnActions = categories.map((c) => ({
    key: c.id,
    emoji: c.emoji,
    label: renderRuby(c.name),
    gradient: `linear-gradient(135deg, ${c.color || '#9b7af7'}, #9b7af7)`
  }));
  
  const spendAction = { 
    key: 'reward', 
    emoji: '🎁', 
    label: renderRuby('ごほうびをもらう'), 
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

        {/* 目標（ほしいごほうび）と進捗バー */}
        {targetReward ? (
          <div className={`goal-card ${isGoalReached ? 'reached' : ''}`}>
            <div className="goal-header">
              <div className="goal-title-wrap">
                <span style={{ fontSize: '1.4rem' }}>{targetReward.emoji}</span>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', lineHeight: 1 }}>
                    {renderRuby('めざす [ごほうび]')}
                  </span>
                  <strong style={{ fontSize: '1.05rem' }}>{renderRuby(targetReward.name)}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={`goal-badge ${isGoalReached ? 'reached' : ''}`}>
                  {isGoalReached ? '🎉 たっせい！' : `${progressPercent}%`}
                </span>
                <button
                  className="btn btn-sm btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.75rem', minWidth: 0, border: 'none', background: '#f5f5f5' }}
                  onClick={() => setShowGoalModal(true)}
                  title="目標を変更"
                >
                  かえる
                </button>
              </div>
            </div>

            {/* 進捗バー */}
            <div className="progress-bar-bg">
              <div
                className={`progress-bar-fill ${isGoalReached ? 'reached' : ''}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="goal-footer">
              <span style={{ color: isGoalReached ? '#2e7d32' : 'var(--text-light)', fontSize: '0.85rem' }}>
                {isGoalReached ? (
                  'いつでも交換できるよ！'
                ) : (
                  <>あと <strong style={{ color: 'var(--pink-dark)', fontSize: '1.1rem' }}>{shortage}</strong> pt</>
                )}
              </span>
              <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                {total} / {targetReward.cost} pt
              </span>
            </div>

            {isGoalReached && (
              <button
                className="btn btn-yellow btn-full btn-sm"
                style={{ marginTop: 10, fontWeight: 900 }}
                onClick={() => navigate(`/child/${id}/rewards`)}
              >
                🎁 今すぐごほうびをもらう！
              </button>
            )}
          </div>
        ) : (
          <div
            className="goal-card"
            style={{
              borderStyle: 'dashed',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.7)'
            }}
            onClick={() => setShowGoalModal(true)}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🎯</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--pink-dark)' }}>
              {renderRuby('ほしい [ごほうび] を えらぼう！')}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 2 }}>
              目標を決めると、あと何ポイントかがわかるよ
            </p>
          </div>
        )}

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

        <div className="dashboard-section-label">{renderRuby('ごほうびをもらう')}</div>
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

      {/* 目標選択モーダル */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ textAlign: 'center', marginBottom: 6 }}>🎯 目標をえらぶ</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', textAlign: 'center', marginBottom: 16 }}>
              めざしたいごほうびを1つえらんでね！
            </p>

            <div style={{ maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rewards.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: 16 }}>
                  ごほうびがまだ登録されていません
                </p>
              ) : (
                rewards.map((r) => {
                  const isSelected = activeTargetId === r.id;
                  return (
                    <button
                      key={r.id}
                      className="card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        border: isSelected ? '2px solid var(--pink)' : '1px solid #eee',
                        background: isSelected ? 'var(--bg)' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onClick={() => handleSetGoal(r.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.8rem' }}>{r.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{renderRuby(r.name)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{r.cost} ポイント</div>
                        </div>
                      </div>
                      <div>
                        {isSelected ? (
                          <span className="goal-badge">★ 目標中</span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>えらぶ ›</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex-col gap-8" style={{ marginTop: 16 }}>
              {activeTargetId && (
                <button
                  className="btn btn-outline btn-full btn-sm"
                  onClick={() => handleSetGoal(null)}
                >
                  目標を解除する
                </button>
              )}
              <button
                className="btn btn-outline btn-full"
                onClick={() => setShowGoalModal(false)}
              >
                とじる
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
