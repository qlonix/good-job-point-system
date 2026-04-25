import { useState } from 'react';
import Header from '../../components/Header';
import { getEmojis, saveEmojis } from '../../data/store';

export default function EmojiManager() {
  const [emojis, setEmojis] = useState(getEmojis());
  const [newEmoji, setNewEmoji] = useState('');

  const handleAdd = async () => {
    const trimmed = newEmoji.trim();
    if (!trimmed) return;
    if (emojis.includes(trimmed)) {
      alert('既に追加されています');
      return;
    }
    const next = [...emojis, trimmed];
    await saveEmojis(next);
    setEmojis([...next]);
    setNewEmoji('');
  };

  const handleDelete = async (e) => {
    if (!confirm('削除しますか？')) return;
    const next = emojis.filter(item => item !== e);
    await saveEmojis(next);
    setEmojis([...next]);
  };

  const handleMove = async (idx, dir) => {
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === emojis.length - 1)) return;
    const next = [...emojis];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    await saveEmojis(next);
    setEmojis([...next]);
  };

  return (
    <div className="page admin-page">
      <Header title="✨ 絵文字管理" showBack />

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 12 }}>
          アバター設定やタスク作成時に使用できる絵文字を追加・整理できます。
        </p>
        <div className="flex gap-8">
          <input 
            className="input" 
            value={newEmoji} 
            onChange={(e) => setNewEmoji(e.target.value)} 
            placeholder="新しい絵文字を入力"
            style={{ flex: 1 }}
          />
          <button className="btn btn-admin" onClick={handleAdd}>追加</button>
        </div>
      </div>

      <div className="admin-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {emojis.map((e, i) => (
          <div key={i} className="card" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.5rem' }}>{e}</span>
            <div className="flex gap-4">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button className="btn btn-sm btn-outline" style={{ padding: '0 4px', fontSize: '10px' }} onClick={() => handleMove(i, -1)}>▲</button>
                <button className="btn btn-sm btn-outline" style={{ padding: '0 4px', fontSize: '10px' }} onClick={() => handleMove(i, 1)}>▼</button>
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e)}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
