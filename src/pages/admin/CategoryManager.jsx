import { useState } from 'react';
import Header from '../../components/Header';
import { getCategories, saveCategories, getEmojis } from '../../data/store';
import SortableList from '../../components/SortableList';
import { renderRuby } from '../../utils/format';

export default function CategoryManager() {
  const [categories, setCategories] = useState(getCategories());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id: '', name: '', emoji: '✨', color: '#ff9a9e' });
  const emojis = getEmojis('task');

  const handleSave = async () => {
    if (!form.name.trim() || !form.id.trim()) return;
    let newCats;
    if (editing) {
      newCats = categories.map(c => c.id === editing.id ? form : c);
    } else {
      newCats = [...categories, form];
    }
    await saveCategories(newCats);
    setCategories([...newCats]);
    setShowModal(false);
  };

  const handleReorder = async (next) => {
    setCategories([...next]);
    await saveCategories(next);
  };

  const handleDelete = async (id) => {
    if (!confirm('削除しますか？ そのカテゴリのタスクが子ども用画面で表示されなくなります。')) return;
    const newCats = categories.filter(c => c.id !== id);
    await saveCategories(newCats);
    setCategories([...newCats]);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ id: '', name: '', emoji: '✨', color: '#ff9a9e' });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm(c);
    setShowModal(true);
  };

  return (
    <div className="page admin-page">
      <Header title="🏠 カテゴリ管理" showBack />
      
      <div className="card" style={{ marginBottom: 24, fontSize: '0.9rem', color: 'var(--text-light)' }}>
        <p>カテゴリは、子どもの画面のトップにボタンとして表示されます。ドラッグで並び替え可能です。</p>
      </div>

      <button className="btn btn-admin btn-full" style={{ marginBottom: 16 }} onClick={openAdd}>+ カテゴリを追加</button>

      <div className="admin-list">
        <SortableList
          items={categories}
          onReorder={handleReorder}
          renderItem={(c, i, { attributes, listeners }) => (
            <div className="admin-list-item" style={{ marginBottom: 12 }}>
              <div className="item-main">
                <div className="drag-handle" {...attributes} {...listeners}>⋮⋮</div>
                <span className="item-emoji" style={{ background: c.color, borderRadius: '8px', color: '#fff', padding: '4px' }}>{c.emoji}</span>
                <div className="item-info">
                  <div className="item-name">{renderRuby(c.name)}</div>
                  <div className="item-sub">ID: {c.id}</div>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>✏️</button>
                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>🗑</button>
              </div>
            </div>
          )}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'カテゴリを編集' : 'カテゴリを追加'}</h2>
            
            <div className="form-group">
              <label className="label">カテゴリID (半角英数)</label>
              <input 
                className="input" 
                value={form.id} 
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, id: e.target.value.replace(/[^a-z0-9]/g, '') })} 
                placeholder="例: routine"
              />
            </div>

            <div className="form-group">
              <label className="label">表示名</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例: [せいかつ(せいかつ)]" />
            </div>

            <div className="form-group">
              <label className="label">アイコン</label>
              <div className="emoji-grid">
                {emojis.slice(0, 20).map((e) => (
                  <button key={e} className={`emoji-option ${form.emoji === e ? 'selected' : ''}`} onClick={() => setForm({ ...form, emoji: e })}>{e}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label">テーマカラー</label>
              <input type="color" className="input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ height: 44, padding: 4 }} />
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
