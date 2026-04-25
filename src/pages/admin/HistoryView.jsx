import { useState } from 'react';
import Header from '../../components/Header';
import { getChildren } from '../../data/store';

export default function HistoryView() {
  const children = getChildren();
  const [selectedChild, setSelectedChild] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const allHistory = children.flatMap((c) =>
    (c.history || []).map((h) => ({ ...h, childName: c.name, childAvatar: c.avatar, childId: c.id }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = allHistory
    .filter((h) => selectedChild === 'all' || h.childId === selectedChild)
    .filter((h) => typeFilter === 'all' || h.type === typeFilter);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="page admin-page">
      <Header title="📊 ポイント履歴" showBack />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="input" style={{ flex: 1, minWidth: 120 }} value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}>
          <option value="all">全員</option>
          {children.map((c) => (
            <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>
          ))}
        </select>
        <select className="input" style={{ flex: 1, minWidth: 120 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">すべて</option>
          <option value="earn">獲得のみ</option>
          <option value="spend">利用のみ</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-emoji">📊</div><p>履歴がありません</p></div>
      ) : (
        filtered.slice(0, 100).map((h) => (
          <div key={h.id} className="history-item">
            <span className="h-emoji">{h.taskEmoji}</span>
            <div className="h-info">
              <div className="h-name">{h.childAvatar} {h.childName} — {h.taskName}</div>
              <div className="h-date">{formatDate(h.date)}</div>
            </div>
            <div className={`h-points ${h.type}`}>
              {h.type === 'earn' ? '+' : '−'}{h.points}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
