import { useState } from 'react';
import Header from '../../components/Header';
import { getTasks, addTask, updateTask, deleteTask } from '../../data/store';

const EMOJIS = ['🍽️','🧹','👕','🐕','🗑️','🍳','👟','📝','📖','✍️','🔢','🔤','🧽','🛁','🌱','🧺','📐','🎨','🎵','💪'];

export default function TaskManager() {
  const [tab, setTab] = useState('otetsudai');
  const [tasks, setTasks] = useState(getTasks());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '✨', points: 10, category: 'otetsudai' });

  const refresh = () => setTasks(getTasks());
  const filtered = tasks.filter((t) => t.category === tab);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', emoji: '✨', points: 10, category: tab });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, emoji: t.emoji, points: t.points, category: t.category });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) updateTask(editing.id, form);
    else addTask(form);
    setShowModal(false);
    refresh();
  };

  const handleDelete = (id) => {
    if (confirm('削除しますか？')) { deleteTask(id); refresh(); }
  };

  return (
    <div className="page admin-page">
      <Header title="📋 タスク管理" showBack />

      <div className="tabs">
        <button className={`tab ${tab === 'otetsudai' ? 'active' : ''}`} onClick={() => setTab('otetsudai')}>🧹 おてつだい</button>
        <button className={`tab ${tab === 'obenkyo' ? 'active' : ''}`} onClick={() => setTab('obenkyo')}>📚 おべんきょう</button>
      </div>

      <button className="btn btn-admin btn-full" onClick={openAdd}>+ タスクを追加</button>

      <div className="admin-list">
        {filtered.length === 0 && (
          <div className="empty-state"><div className="empty-emoji">📋</div><p>タスクがありません</p></div>
        )}
        {filtered.map((t) => (
          <div key={t.id} className="admin-list-item">
            <span className="item-emoji">{t.emoji}</span>
            <div className="item-info">
              <div className="item-name">{t.name}</div>
              <div className="item-sub">{t.points} ポイント</div>
            </div>
            <div className="item-actions">
              <button className="btn btn-sm btn-outline" onClick={() => openEdit(t)}>✏️</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'タスクを編集' : 'タスクを追加'}</h2>
            <div className="form-group">
              <label className="label">名前</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">絵文字</label>
              <div className="emoji-grid">
                {EMOJIS.map((e) => (
                  <button key={e} className={`emoji-option ${form.emoji === e ? 'selected' : ''}`} onClick={() => setForm({ ...form, emoji: e })}>{e}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="label">ポイント</label>
              <input className="input" type="number" min="1" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="label">カテゴリ</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="otetsudai">おてつだい</option>
                <option value="obenkyo">おべんきょう</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>キャンセル</button>
              <button className="btn btn-admin" style={{ flex: 1 }} onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
