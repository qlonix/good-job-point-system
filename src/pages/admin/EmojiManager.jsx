import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { getEmojis, saveEmojis } from '../../data/store';
import SortableList from '../../components/SortableList';
import { rectSortingStrategy } from '@dnd-kit/sortable';

export default function EmojiManager() {
  const [type, setType] = useState('task');
  const [emojis, setEmojis] = useState([]);
  const [newEmoji, setNewEmoji] = useState('');

  useEffect(() => {
    setEmojis(getEmojis(type));
  }, [type]);

  const handleAdd = async () => {
    const trimmed = newEmoji.trim();
    if (!trimmed) return;
    if (emojis.includes(trimmed)) {
      alert('既に追加されています');
      return;
    }
    const next = [...emojis, trimmed];
    await saveEmojis(next, type);
    setEmojis([...next]);
    setNewEmoji('');
  };

  const handleDelete = async (e) => {
    if (!confirm('削除しますか？')) return;
    const next = emojis.filter(item => item !== e);
    await saveEmojis(next, type);
    setEmojis([...next]);
  };

  const handleReorder = async (next) => {
    await saveEmojis(next, type);
    setEmojis([...next]);
  };

  const typeLabels = {
    task: 'タスク用',
    reward: 'ごほうび用',
    avatar: 'アバター用'
  };

  const DEFAULTS = {
    task: ['📝','📖','✍️','🔢','🎨','🎹','🧹','🧼','🍽️','🧺','🗑️','🌱','🐕','👟','🛌','🏫','🧪','📏','🏃','🧽'],
    reward: ['🍦','🍪','🍫','🍭','🍕','🎡','🎮','📺','🧸','📚','🎁','💰','🎟️','🎈','⭐','🎬','🏞️','🍱','🍰','⚽'],
    avatar: ['👧','👦','👶','🧒','👱','🐱','🐶','🐰','🦊','🐻','🐼','🦁','🐮','🐷','🐵','🐧','🐙','🦋']
  };

  const handleReset = async () => {
    if (!confirm('標準のセットに戻しますか？（現在のリストは上書きされます）')) return;
    const next = DEFAULTS[type];
    await saveEmojis(next, type);
    setEmojis([...next]);
  };

  return (
    <div className="page admin-page">
      <Header title="✨ 絵文字管理" showBack />

      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab ${type === 'task' ? 'active' : ''}`} onClick={() => setType('task')}>📋 タスク</button>
        <button className={`tab ${type === 'reward' ? 'active' : ''}`} onClick={() => setType('reward')}>🎁 ごほうび</button>
        <button className={`tab ${type === 'avatar' ? 'active' : ''}`} onClick={() => setType('avatar')}>👧 アバター</button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 16 }}>
          {typeLabels[type]}設定時に使用できる絵文字を追加・整理できます。
        </p>
        <div className="flex-col gap-12">
          <input 
            className="input" 
            value={newEmoji} 
            onChange={(e) => setNewEmoji(e.target.value)} 
            placeholder="新しい絵文字を入力"
          />
          <button className="btn btn-admin btn-full" onClick={handleAdd}>絵文字を追加</button>
          <button className="btn btn-outline btn-full btn-sm" style={{ marginTop: 8 }} onClick={handleReset}>標準セットに戻す</button>
        </div>
      </div>

      <div style={{ paddingBottom: 40 }}>
        <SortableList
          items={emojis}
          onReorder={handleReorder}
          strategy={rectSortingStrategy}
          renderItem={(e, i, { attributes, listeners }) => (
            <div className="card" style={{ 
              padding: '8px 12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="drag-handle" {...attributes} {...listeners} style={{ padding: '0 4px' }}>⋮⋮</div>
                <span style={{ fontSize: '1.5rem' }}>{e}</span>
              </div>
              <button 
                className="btn btn-sm btn-danger" 
                style={{ padding: '4px 8px', minWidth: 'auto' }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  handleDelete(e);
                }}
              >
                ×
              </button>
            </div>
          )}
        />
      </div>

      <style>{`
        .sortable-list-wrapper {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
