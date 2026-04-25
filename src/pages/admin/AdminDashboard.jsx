import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

const MENU = [
  { path: '/admin/children', emoji: '👧', label: '子ども管理', sub: 'カード登録・ポイント調整' },
  { path: '/admin/tasks', emoji: '📋', label: 'タスク管理', sub: '各カテゴリのタスク編集' },
  { path: '/admin/categories', emoji: '🏠', label: 'カテゴリ管理', sub: 'ボタンの追加・名前変更' },
  { path: '/admin/rewards', emoji: '🎁', label: 'ごほうび管理', sub: '交換アイテム設定' },
  { path: '/admin/emojis', emoji: '✨', label: '絵文字管理', sub: '選択肢の追加・削除' },
  { path: '/admin/history', emoji: '📊', label: 'ポイント履歴', sub: '獲得・利用の記録' },
  { path: '/admin/settings', emoji: '⚙️', label: '設定', sub: 'PIN変更・データ管理' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="page admin-page">
      <div className="admin-header">
        <h1>🛠 管理ダッシュボード</h1>
      </div>

      <div className="admin-menu">
        {MENU.map((m) => (
          <button key={m.path} className="admin-menu-item" onClick={() => navigate(m.path)}>
            <span className="menu-emoji">{m.emoji}</span>
            <div>
              <div>{m.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 400 }}>{m.sub}</div>
            </div>
            <span className="menu-arrow">›</span>
          </button>
        ))}
      </div>

      <button className="btn btn-outline btn-full" style={{ marginTop: 24 }} onClick={() => navigate('/')}>
        ← ホームにもどる
      </button>
    </div>
  );
}
