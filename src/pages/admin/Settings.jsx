import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { getPin, setPin, exportData, importData, resetData, resetAllPoints, getChildren, resetChildPoints } from '../../data/store';
import { isBiometricRegistered, clearBiometric, checkBiometricSupport, registerBiometric } from '../../utils/auth';

const IS_WEBKIT = 'WebkitTextSecurity' in document.documentElement.style;

export default function Settings() {
  const navigate = useNavigate();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [dataMsg, setDataMsg] = useState('');
  const [bioSupported, setBioSupported] = useState(false);
  const [bioRegistered, setBioRegistered] = useState(isBiometricRegistered());
  const [resetChildId, setResetChildId] = useState('');
  const children = getChildren();

  useEffect(() => {
    checkBiometricSupport().then(supported => setBioSupported(supported));
  }, []);

  const handlePinChange = () => {
    if (currentPin !== getPin()) { setPinMsg('現在のPINが違います'); return; }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setPinMsg('4桁の数字を入力してください'); return; }
    setPin(newPin);
    setPinMsg('✅ PINを変更しました');
    setCurrentPin(''); setNewPin('');
  };

  const handleRegisterBiometric = async () => {
    try {
      const credential = await registerBiometric();
      if (credential) {
        setBioRegistered(true);
        alert('端末の認証を登録しました');
      }
    } catch (e) {
      alert('登録に失敗しました。この端末ではサポートされていない可能性があります。');
    }
  };

  const handleClearBiometric = () => {
    if (confirm('この端末の認証登録を解除しますか？')) {
      clearBiometric();
      setBioRegistered(false);
      alert('解除しました');
    }
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
      setDataMsg('✅ 全員のポイントリセットが完了しました');
      setTimeout(() => setDataMsg(''), 3000);
    }
  };

  const handleResetIndividual = async () => {
    if (!resetChildId) return;
    const child = children.find(c => c.id === resetChildId);
    if (confirm(`${child.name}ちゃん/くんのポイントと履歴のみをゼロにしますか？\n\nこの操作は取り消せません！`)) {
      await resetChildPoints(resetChildId);
      setDataMsg(`✅ ${child.name}ちゃん/くんのリセットが完了しました`);
      setResetChildId('');
      setTimeout(() => setDataMsg(''), 3000);
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
        <button className="btn btn-admin btn-full" style={{ marginTop: 8 }} onClick={handlePinChange}>PINを変更</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>🔐 端末の認証（顔・指紋・画面ロック）</h3>
        {!bioSupported ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
            この端末・ブラウザは端末の認証（WebAuthn）をサポートしていません。
          </p>
        ) : bioRegistered ? (
          <div className="flex-col gap-8">
            <p style={{ fontSize: '0.85rem', color: '#2a7d56', fontWeight: 700 }}>
              ✅ この端末の認証が登録されています
            </p>
            <button className="btn btn-outline btn-full" onClick={handleClearBiometric}>端末の認証を解除する</button>
          </div>
        ) : (
          <div className="flex-col gap-8">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
              この端末の認証機能を登録すると、次回からパスコード入力の手間を省けます。
            </p>
            <button className="btn btn-admin btn-full" onClick={handleRegisterBiometric}>この端末を登録する</button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>💾 データ管理</h3>
        {dataMsg && <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2a7d56', marginBottom: 12, animation: 'fadeIn 0.3s' }}>{dataMsg}</p>}
        <div className="flex-col gap-8">
          <button className="btn btn-outline btn-full" onClick={handleExport}>📤 データをエクスポート</button>
          <button className="btn btn-outline btn-full" onClick={handleImport}>📥 データをインポート</button>
          <div style={{ height: 16 }}></div>
          <button className="btn btn-danger btn-full" onClick={handleResetPoints}>⚠️ 全員のポイントをリセット</button>
          
          <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, marginTop: 8 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 8 }}>🙎‍♂️ 特定の人のみリセット</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <select 
                className="input" 
                style={{ flex: 1, fontSize: '0.9rem' }}
                value={resetChildId}
                onChange={(e) => setResetChildId(e.target.value)}
              >
                <option value="">子どもを選択...</option>
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button 
                className="btn btn-danger" 
                style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}
                disabled={!resetChildId}
                onClick={handleResetIndividual}
              >リセット</button>
            </div>
          </div>

          <button className="btn btn-danger btn-full" onClick={handleReset} style={{ opacity: 0.5, marginTop: 16 }}>🗑 すべてのデータをリセット</button>
        </div>
      </div>
    </div>
  );
}
