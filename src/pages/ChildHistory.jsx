import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Header from '../components/Header';
import { getChildById } from '../data/store';
import { renderRuby } from '../utils/format';

export default function ChildHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('list');

  // Use the same synchronous pattern as ChildDashboard
  const child = getChildById(id);

  if (!child) {
    return (
      <div className="page">
        <Header title={renderRuby('[履歴(りれき)]')} showBack />
        <div className="empty-state" style={{ marginTop: 100 }}>
          <p>{renderRuby('[探(さが)]しています...')} 🔍</p>
          <button
            className="btn btn-outline"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/')}
          >
            トップにもどる
          </button>
        </div>
      </div>
    );
  }

  // Derive data directly - no hooks needed
  const history = Array.isArray(child.history) ? child.history : [];

  const earned = history
    .filter((h) => h.type === 'earn')
    .reduce((sum, h) => sum + (h.points || 0), 0);
  const spent = history
    .filter((h) => h.type === 'spend')
    .reduce((sum, h) => sum + (h.points || 0), 0);

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
  );

  const formatDate = (iso) => {
    if (!iso) return '--/--';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '--/--';
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Calendar data for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const calYear = now.getFullYear();
  const calMonth = now.getMonth() + 1;
  const startDay = startOfMonth.getDay();

  const calDays = [];
  for (let i = 0; i < startDay; i++) calDays.push(null);
  for (let i = 1; i <= endOfMonth.getDate(); i++) {
    const datePrefix = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const hasEarned = history.some(
      (h) => h.type === 'earn' && typeof h.date === 'string' && h.date.startsWith(datePrefix)
    );
    calDays.push({ day: i, hasEarned });
  }

  // Chart data for last 7 days
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const datePrefix = d.toISOString().split('T')[0];
    const dailyEarned = history
      .filter((h) => h.type === 'earn' && typeof h.date === 'string' && h.date.startsWith(datePrefix))
      .reduce((sum, h) => sum + (h.points || 0), 0);
    chartData.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, value: dailyEarned });
  }
  const maxVal = Math.max(...chartData.map((d) => d.value), 10);

  return (
    <div className="page">
      <Header title={renderRuby('[履歴(りれき)]')} showBack />

      {/* Child info */}
      <div className="text-center" style={{ marginBottom: 16 }}>
        <div className="dashboard-avatar" style={{ width: 64, height: 64, margin: '0 auto 8px' }}>
          {child.avatarImage ? (
            <img
              src={child.avatarImage}
              alt="avatar"
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span className="emoji-lg">{child.avatar}</span>
          )}
        </div>
        <h2 style={{ fontSize: '1.1rem' }}>
          {renderRuby(child.name)} の {renderRuby('[履歴(りれき)]')}
        </h2>
      </div>

      {/* Stats */}
      <div
        className="card"
        style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-around', padding: '12px 8px' }}
      >
        <div className="text-center">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            {renderRuby('[合計獲得(ごうけいかくとく)]')}
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--pink-dark)' }}>{earned}</div>
        </div>
        <div style={{ width: 1, background: '#eee' }} />
        <div className="text-center">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            {renderRuby('[合計使用(ごうけいしよう)]')}
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#555' }}>{spent}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
          📜 リスト
        </button>
        <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>
          📅 {renderRuby('[月(つき)]')}
        </button>
        <button className={`tab ${view === 'graph' ? 'active' : ''}`} onClick={() => setView('graph')}>
          📊 {renderRuby('[日(ひ)]')}
        </button>
      </div>

      {/* Content */}
      <div style={{ paddingBottom: 40 }}>
        {view === 'list' && (
          <div className="history-list">
            {sortedHistory.length === 0 ? (
              <div className="empty-state">
                <div className="empty-emoji">📊</div>
                <p>まだありません</p>
              </div>
            ) : (
              sortedHistory.map((h) => (
                <div
                  key={h.id}
                  className="history-item card"
                  style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{h.taskEmoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{renderRuby(h.taskName)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{formatDate(h.date)}</div>
                  </div>
                  <div
                    className={`h-points ${h.type}`}
                    style={{ fontWeight: 900, fontSize: '1.1rem' }}
                  >
                    {h.type === 'earn' ? '+' : '−'}{h.points}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'calendar' && (
          <div className="card">
            <h3 style={{ textAlign: 'center', marginBottom: 12, fontSize: '1rem' }}>
              {calYear}年 {calMonth}月
            </h3>
            <div className="calendar-grid">
              {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
                <div key={d} className="cal-day-head">{d}</div>
              ))}
              {calDays.map((d, i) => (
                <div key={i} className={`cal-day ${d ? '' : 'empty'}`}>
                  {d && (
                    <>
                      <span className="cal-num">{d.day}</span>
                      {d.hasEarned && <span className="cal-dot" />}
                    </>
                  )}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: 12, textAlign: 'center' }}>
              ● = {renderRuby('[頑張(がんば)]った[日(ひ)]')}
            </p>
          </div>
        )}

        {view === 'graph' && (
          <div className="card">
            <h3 style={{ textAlign: 'center', marginBottom: 20, fontSize: '1rem' }}>
              {renderRuby('[直近(ちょっきん)]')} 7{renderRuby('[日間(にちかん)]')}の
              {renderRuby('[獲得(かくとく)]')}
            </h3>
            <div className="bar-chart">
              {chartData.map((d, i) => (
                <div key={i} className="bar-item">
                  <div className="bar-val">{d.value > 0 ? d.value : ''}</div>
                  <div className="bar-fill" style={{ height: `${(d.value / maxVal) * 100}%` }} />
                  <div className="bar-label">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .h-points.earn { color: var(--pink-dark); }
        .h-points.spend { color: #555; }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .cal-day-head {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-light);
          padding: 4px 0;
        }
        .cal-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 8px;
          position: relative;
        }
        .cal-day.empty { background: transparent; }
        .cal-num { font-size: 0.85rem; font-weight: 700; }
        .cal-dot {
          width: 6px;
          height: 6px;
          background: var(--pink);
          border-radius: 50%;
          margin-top: 2px;
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 150px;
          padding: 0 8px;
        }
        .bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          margin: 0 2px;
        }
        .bar-fill {
          width: 100%;
          background: linear-gradient(to top, var(--pink), var(--pink-light));
          border-radius: 4px 4px 0 0;
          min-height: 2px;
          transition: height 0.3s ease;
        }
        .bar-val { font-size: 0.65rem; font-weight: 800; margin-bottom: 2px; height: 12px; }
        .bar-label { font-size: 0.65rem; color: var(--text-light); margin-top: 4px; }
      `}</style>
    </div>
  );
}
