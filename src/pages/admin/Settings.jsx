import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { getPin, setPin, exportData, importData, resetData, resetAllPoints } from '../../data/store';

const IS_WEBKIT = 'WebkitTextSecurity' in document.documentElement.style;

export default function Settings() {
  const navigate = useNavigate();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  const handlePinChange = () => {
    if (currentPin !== getPin()) { setPinMsg('現在のPINが違います'); return; }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setPinMsg('4桁の数字を入力してください'); return; }
    setPin(newPin);
    setPinMsg('✅ PINを変更しました');
    setCurrentPin(''); setNewPin('');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'otetsudai-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (importData(ev.target.result)) {
          alert('データをインポートしました');
          navigate('/admin/dashboard');
        } else {
          alert('インポートに失敗しました');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('本当にすべてのデータをリセットしますか？\nこの操作は取り消せません。')) {
      resetData();
      alert('データをリセットしました');
      navigate('/admin/dashboard');
    }
  };

  const handleResetPoints = async () => {
    if (confirm('全員のポイントと履歴のみをゼロにしますか？\n(子どもやタスクの設定は残ります)\n\nこの操作は取り消せません！')) {
      await resetAllPoints();
      alert('ポイントと履歴をリセットしました');
    }
  };

  return (
    <div className="page admin-page">
      <Header title="⚙️ 設定" showBack />

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>🔑 PINコード変更</h3>
        <div className="form-group">
          <label className="label">現在のPIN</label>
          <input className="input" type={IS_WEBKIT ? 'text' : 'password'} inputMode="numeric" maxLength={4} value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))} style={{ WebkitTextSecurity: 'disc' }} />
        </div>
        <div className="form-group">
          <label className="label">新しいPIN (4桁)</label>
          <input className="input" type={IS_WEBKIT ? 'text' : 'password'} inputMode="numeric" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} style={{ WebkitTextSecurity: 'disc' }} />
        </div>
        {pinMsg && <p style={{ fontSize: '0.85rem', fontWeight: 700, color: pinMsg.includes('✅') ? '#2a7d56' : 'var(--pink-dark)', marginBottom: 8 }}>{pinMsg}</p>}
        <button className="btn btn-admin btn-full" onClick={handlePinChange}>PINを変更</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>💾 データ管理</h3>
        <div className="flex-col gap-8">
          <button className="btn btn-outline btn-full" onClick={handleExport}>📤 データをエクスポート</button>
          <button className="btn btn-outline btn-full" onClick={handleImport}>📥 データをインポート</button>
          <div style={{ height: 16 }}></div>
          <button className="btn btn-danger btn-full" onClick={handleResetPoints}>⚠️ ポイントと履歴のみをリセット</button>
          <button className="btn btn-danger btn-full" onClick={handleReset} style={{ opacity: 0.5 }}>🗑 すべてのデータをリセット</button>
        </div>
      </div>
    </div>
  );
}
