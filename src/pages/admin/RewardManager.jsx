import { useState } from 'react';
import Header from '../../components/Header';
import { getRewards, addReward, updateReward, deleteReward, reorderRewards, getEmojis } from '../../data/store';
import SortableList from '../../components/SortableList';
import { renderRuby } from '../../utils/format';

export default function RewardManager() {
  const [rewards, setRewards] = useState(getRewards());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '🎁', cost: 20 });
  const emojis = getEmojis('reward');

  const refresh = () => setRewards([...getRewards()]);

  const openAdd = () => { 
    setEditing(null); 
    setForm({ name: '', emoji: emojis[0] || '🎁', cost: 20 }); 
    setShowModal(true); 
  };
  
  const openEdit = (r) => { 
    setEditing(r); 
    setForm({ name: r.name, emoji: r.emoji, cost: r.cost }); 
    setShowModal(true); 
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editing) await updateReward(editing.id, form);
    else await addReward(form);
    setShowModal(false);
    refresh();
  };

  const handleDelete = async (id) => { if (confirm('削除しますか？')) { await deleteReward(id); refresh(); } };

  const handleReorder = async (next) => {
    setRewards([...next]);
    await reorderRewards(next);
  };

  return (
    <div className="page admin-page">
      <Header title="🎁 ごほうび管理" showBack />
      <button className="btn btn-admin btn-full" style={{ marginBottom: 16 }} onClick={openAdd}>+ ごほうびを追加</button>

      <div className="admin-list">
        {rewards.length === 0 && (
          <div className="empty-state"><div className="empty-emoji">🎁</div><p>ごほうびがありません</p></div>
        )}
        <SortableList
          items={rewards}
          onReorder={handleReorder}
          renderItem={(r, i, { attributes, listeners }) => (
            <div className="admin-list-item" style={{ marginBottom: 12 }}>
              <div className="item-main">
                <div className="drag-handle" {...attributes} {...listeners}>⋮⋮</div>
                <span className="item-emoji">{r.emoji}</span>
                <div className="item-info">
                  <div className="item-name">{renderRuby(r.name)}</div>
                  <div className="item-sub">{r.cost} ポイント</div>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>✏️</button>
                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}>🗑</button>
              </div>
            </div>
          )}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'ごほうびを編集' : 'ごほうびを追加'}</h2>
            <div className="form-group">
              <label className="label">名前</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例: シール1[枚(まい)]" />
            </div>
            <div className="form-group">
              <label className="label">絵文字</label>
              <div className="emoji-grid">
                {emojis.map((e) => (
                  <button 
                    key={e} 
                    className={`emoji-option ${form.emoji === e ? 'selected' : ''}`} 
                    onClick={() => setForm({ ...form, emoji: e })}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="label">必要ポイント</label>
              <input className="input" type="number" min="1" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
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
