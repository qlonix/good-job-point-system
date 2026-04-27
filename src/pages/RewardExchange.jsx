import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Header from '../components/Header';
import Confetti from '../components/Confetti';
import ApprovalModal from '../components/ApprovalModal';
import { getRewards, spendPoints, getChildById, getTotalPoints } from '../data/store';
import { renderRuby } from '../utils/format';

export default function RewardExchange() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rewards = getRewards();
  const [child, setChild] = useState(getChildById(id));
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(null);

  if (!child) return null;
  const total = getTotalPoints(child);

  const handleReward = async (rewardId) => {
    const result = await spendPoints(id, rewardId);
    if (result.success) {
      const reward = rewards.find((r) => r.id === rewardId);
      setSuccess({ emoji: reward.emoji, name: reward.name, cost: reward.cost });
      setChild(getChildById(id));
    } else if (result.reason === 'insufficient') {
      setError(`ポイントがたりないよ！ あと ${result.shortage} ポイント`);
      setTimeout(() => setError(''), 2500);
    }
  };

  return (
    <div className="page">
      <Header title="🎁 ごほうび" showBack />
      <div className="card text-center" style={{ marginBottom: 16 }}>
        <div className="point-label">いまのポイント</div>
        <div className="point-total">{total}</div>
      </div>

      {error && (
        <div style={{ color: 'var(--pink-dark)', fontWeight: 700, textAlign: 'center', marginBottom: 12, animation: 'wiggle 0.4s ease' }}>
          {error}
        </div>
      )}

      <div className="task-grid">
        {rewards.map((r) => {
          const canAfford = total >= r.cost;
          return (
            <button
              key={r.id}
              className={`task-card reward-card ${canAfford ? '' : 'disabled'}`}
              onClick={() => canAfford && setConfirming(r)}
            >
              <span className="task-emoji">{r.emoji}</span>
              <span className="task-name">{renderRuby(r.name)}</span>
              <span className="task-points">{r.cost} pt</span>
              {!canAfford && (
                <span className="reward-shortage">あと {r.cost - total} pt</span>
              )}
            </button>
          );
        })}
      </div>

      {confirming && (
        <ApprovalModal
          actionLabel={confirming.name}
          actionEmoji={confirming.emoji}
          childName={child.name}
          onApprove={() => {
            handleReward(confirming.id);
            setConfirming(null);
          }}
          onCancel={() => setConfirming(null)}
        />
      )}

      {success && (
        <>
          <Confetti count={60} />
          <div className="success-overlay" onClick={() => { setSuccess(null); navigate(`/child/${id}`); }}>
            <div className="success-emoji">{success.emoji}</div>
            <div className="success-text">{renderRuby(`${success.name} [獲得(かくとく)]！`)}</div>
            <div className="success-points">−{success.cost} ポイント</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-light)' }}>
              おめでとう！🎉
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 20 }}>
              （タップして もどる）
            </div>
          </div>
        </>
      )}
    </div>
  );
}
