import { useState } from 'react';
import Header from '../../components/Header';
import { getTasks, addTask, updateTask, deleteTask, getCategories, getEmojis, reorderTasks } from '../../data/store';
import SortableList from '../../components/SortableList';
import { renderRuby } from '../../utils/format';

export default function TaskManager() {
  const categories = getCategories();
  const emojis = getEmojis('task');
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
    setShowModal(false);
    if (editing) {
        await updateTask(editing.id, form);
    } else {
        await addTask(form);
    }
    refresh();
  };

  const handleDelete = async (id) => {
    if (confirm('削除しますか？')) {
        setTasks(tasks.filter(t => t.id !== id));
        await deleteTask(id);
        refresh();
    }
  };

  const handleReorder = async (nextFiltered) => {
    // フィルタリングされたリスト内の並び順を全体のリストに反映する
    const newTasks = [...tasks];
    
    // 現在のタブのタスクのインデックスを特定
    const indices = tasks.map((t, i) => t.category === tab ? i : -1).filter(i => i !== -1);
    
    // 全体リスト内の該当箇所を新しい順序で置き換え
    indices.forEach((originalIndex, i) => {
      newTasks[originalIndex] = nextFiltered[i];
    });

    setTasks(newTasks);
    await reorderTasks(newTasks);
  };

  return (
    <div className="page admin-page">
      <Header title="📋 タスク管理" showBack />

      <div className="tabs" style={{ marginBottom: 16 }}>
        {categories.map(c => (
          <button key={c.id} className={`tab ${tab === c.id ? 'active' : ''}`} onClick={() => setTab(c.id)}>
            {c.emoji} {renderRuby(c.name)}
          </button>
        ))}
      </div>

      <button className="btn btn-admin btn-full" style={{ marginBottom: 16 }} onClick={openAdd}>+ タスクを追加</button>

      <div className="admin-list">
        {filtered.length === 0 && (
          <div className="empty-state"><div className="empty-emoji">📋</div><p>タスクがありません</p></div>
        )}
        <SortableList
          items={filtered}
          onReorder={handleReorder}
          renderItem={(t, i, { attributes, listeners }) => (
            <div className="admin-list-item" style={{ marginBottom: 12 }}>
              <div className="item-main">
                <div className="drag-handle" {...attributes} {...listeners}>⋮⋮</div>
                <span className="item-emoji">{t.emoji}</span>
                <div className="item-info">
                  <div className="item-name">{renderRuby(t.name)}</div>
                  <div className="item-sub">{t.points} ポイント</div>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openEdit(t); }}>✏️</button>
                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}>🗑</button>
              </div>
            </div>
          )}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'タスクを編集' : 'タスクを追加'}</h2>
            <div className="form-group">
              <label className="label">名前</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例: [宿題(しゅくだい)]をやる" />
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
