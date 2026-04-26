import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Header from '../components/Header';
import Confetti from '../components/Confetti';
import ApprovalModal from '../components/ApprovalModal';
import { getTasks, addPoints, getCategories, getChildById } from '../data/store';
import { renderRuby } from '../utils/format';

export default function TaskSelect() {
  const { id, category } = useParams();
  const navigate = useNavigate();
  const tasks = getTasks(category);
  const child = getChildById(id);
  const [success, setSuccess] = useState(null);
  const [confirming, setConfirming] = useState(null);

  if (!child) return null;

  const handleTask = async (taskId) => {
    const result = await addPoints(id, taskId);
    if (result) {
      const task = tasks.find((t) => t.id === taskId);
      setSuccess({ emoji: task.emoji, name: task.name, points: result.pointsAdded });
      setTimeout(() => {
        setSuccess(null);
        navigate(`/child/${id}`);
      }, 2200);
    }
  };

  const categories = getCategories();
  const currentCat = categories.find((c) => c.id === category);
  const title = currentCat ? <span>{currentCat.emoji} {renderRuby(currentCat.name)}</span> : 'タスク';

  return (
    <div className="page">
      <Header title={title} showBack />
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4 }}>
        {renderRuby('[何(なに)]をしたかな？')}
      </h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: 8 }}>
        タップしてポイントゲット！
      </p>

      <div className="task-grid">
        {tasks.map((t) => (
          <button key={t.id} className="task-card" onClick={() => setConfirming(t)}>
            <span className="task-emoji">{t.emoji}</span>
            <span className="task-name">{renderRuby(t.name)}</span>
            <span className="task-points">+{t.points} pt</span>
          </button>
        ))}
      </div>

      {confirming && (
        <ApprovalModal
          actionLabel={confirming.name}
          actionEmoji={confirming.emoji}
          childName={child.name}
          onApprove={() => {
            handleTask(confirming.id);
            setConfirming(null);
          }}
          onCancel={() => setConfirming(null)}
        />
      )}

      {success && (
        <>
          <Confetti />
          <div className="success-overlay" onClick={() => { setSuccess(null); navigate(`/child/${id}`); }}>
            <div className="success-emoji">{success.emoji}</div>
            <div className="success-text">{renderRuby(success.name)}</div>
            <div className="success-points">+{success.points} ポイント！</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-light)' }}>
              すごい！がんばったね！ ✨
            </div>
          </div>
        </>
      )}
    </div>
  );
}
