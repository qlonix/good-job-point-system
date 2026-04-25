import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Header from '../components/Header';
import Confetti from '../components/Confetti';
import { getTasks, addPoints, getChildById } from '../data/store';
import { renderRuby } from '../utils/format';

export default function TaskSelect() {
  const { id, category } = useParams();
  const navigate = useNavigate();
  const tasks = getTasks(category);
  const [success, setSuccess] = useState(null);

  const handleTask = (taskId) => {
    const result = addPoints(id, taskId);
    if (result) {
      const task = tasks.find((t) => t.id === taskId);
      setSuccess({ emoji: task.emoji, name: task.name, points: result.pointsAdded });
      setTimeout(() => {
        setSuccess(null);
        navigate(`/child/${id}`);
      }, 2200);
    }
  };

  const titleMap = {
    otetsudai: <span>🧹 おてつだい</span>,
    obenkyo: <span>📚 おべんきょう</span>,
    seikatsu: <span>🏠 せいかつ</span>
  };
  const title = titleMap[category] || 'タスク';

  return (
    <div className="page">
      <Header title={title} showBack />
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4 }}>
        {renderRuby('何(なに)をしたかな？')}
      </h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: 8 }}>
        タップしてポイントゲット！
      </p>

      <div className="task-grid">
        {tasks.map((t) => (
          <button key={t.id} className="task-card" onClick={() => handleTask(t.id)}>
            <span className="task-emoji">{t.emoji}</span>
            <span className="task-name">{renderRuby(t.name)}</span>
            <span className="task-points">+{t.points} pt</span>
          </button>
        ))}
      </div>

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
