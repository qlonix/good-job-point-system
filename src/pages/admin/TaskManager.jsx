import { useState } from 'react';
import Header from '../../components/Header';
import { getTasks, addTask, updateTask, deleteTask, getCategories, getEmojis, reorderTasks } from '../../data/store';

export default function TaskManager() {
  const categories = getCategories();
  const emojis = getEmojis();
  const [tab, setTab] = useState(categories[0]?.id || '');
  const [tasks, setTasks] = useState(getTasks());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '✨', points: 10, category: categories[0]?.id || '' });

  const refresh = () => setTasks([...getTasks()]);
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

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editing) await updateTask(editing.id, form);
    else await addTask(form);
    setShowModal(false);
    refresh();
  };

  const handleDelete = async (id) => {
    if (confirm('削除しますか？')) { await deleteTask(id); refresh(); }
  };

  const handleMove = async (id, dir) => {
    const idx = tasks.findIndex(t => t.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === tasks.length - 1)) return;
    const nextIdx = tasks.findIndex((t, i) => i > (dir === -1 ? -1 : idx) && i < (dir === -1 ? idx : tasks.length) && t.category === tab && (dir === -1 ? i < idx : i > idx));
    // Actually, simple swap within the filtered list might be confusing if global order matters.
    // Let's find the sibling within the SAME category.
    const sameCatIndices = tasks.map((t, i) => t.category === tab ? i : -1).filter(i => i !== -1);
    const pos = sameCatIndices.indexOf(idx);
    if ((dir === -1 && pos === 0) || (dir === 1 && pos === sameCatIndices.length - 1)) return;
    
    const targetIdx = sameCatIndices[pos + dir];
    const newTasks = [...tasks];
    [newTasks[idx], newTasks[targetIdx]] = [newTasks[targetIdx], newTasks[idx]];
    await reorderTasks(newTasks);
    refresh();
  };

  return (
    <div className="page admin-page">
      <Header title="📋 タスク管理" showBack />

      <div className="tabs">
        {categories.map(c => (
          <button key={c.id} className={`tab ${tab === c.id ? 'active' : ''}`} onClick={() => setTab(c.id)}>
            {c.emoji} {c.name}
          </button>
        ))}
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
              <div className="flex gap-4 mr-8">
                <button className="btn btn-sm btn-outline" style={{ padding: '2px 8px' }} onClick={() => handleMove(t.id, -1)}>↑</button>
                <button className="btn btn-sm btn-outline" style={{ padding: '2px 8px' }} onClick={() => handleMove(t.id, 1)}>↓</button>
              </div>
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
                {emojis.map((e) => (
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
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
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
