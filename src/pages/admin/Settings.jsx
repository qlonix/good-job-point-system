import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { getPin, setPin, getPasskeys, exportData, importData, resetData, resetAllPoints, getChildren, resetChildPoints } from '../../data/store';
import { isPasskeyRegistered, clearPasskeys, deletePasskey, checkPasskeySupport, registerPasskey } from '../../utils/auth';

const IS_WEBKIT = 'WebkitTextSecurity' in document.documentElement.style;

export default function Settings() {
  const navigate = useNavigate();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [dataMsg, setDataMsg] = useState('');
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(isPasskeyRegistered());
  const [passkeys, setPasskeys] = useState(getPasskeys());
  const [passkeyName, setPasskeyName] = useState('');
  const [passkeyMsg, setPasskeyMsg] = useState('');
  const [resetChildId, setResetChildId] = useState('');
  const [children, setChildren] = useState(() => getChildren());

  const refreshPasskeys = () => {
    setPasskeyRegistered(isPasskeyRegistered());
    setPasskeys([...getPasskeys()]);
  };

  useEffect(() => {
    checkPasskeySupport().then(supported => setPasskeySupported(supported));
  }, []);

  const handlePinChange = async () => {
    if (currentPin !== getPin()) { setPinMsg('現在のPINが違います'); return; }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setPinMsg('4桁の数字を入力してください'); return; }
    try {
      await setPin(newPin);
      setPinMsg('✅ PINを変更しました');
      setCurrentPin(''); setNewPin('');
    } catch {
      setPinMsg('❌ PINの変更に失敗しました');
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyMsg('');
    try {
      const credential = await registerPasskey(passkeyName.trim());
      if (credential) {
        setPasskeyName('');
        refreshPasskeys();
        setPasskeyMsg('✅ パスキーを登録しました');
        setTimeout(() => setPasskeyMsg(''), 3000);
      }
    } catch {
      setPasskeyMsg('❌ パスキーの登録に失敗しました');
    }
  };

  const handleDeletePasskey = async (id, name) => {
    if (confirm(`パスキー「${name || '登録済みパスキー'}」を削除しますか？`)) {
      await deletePasskey(id);
      refreshPasskeys();
      setPasskeyMsg('✅ パスキーを削除しました');
      setTimeout(() => setPasskeyMsg(''), 3000);
    }
  };

  const handleClearPasskeys = async () => {
    if (confirm('すべてのパスキー登録を解除しますか？')) {
      await clearPasskeys();
      refreshPasskeys();
      setPasskeyMsg('✅ すべてのパスキーを解除しました');
      setTimeout(() => setPasskeyMsg(''), 3000);
    }
  };

  const handleExport = async () => {
    const data = await exportData();
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
      reader.onload = async (ev) => {
        // インポート完了を待ってから画面遷移する
        if (await importData(ev.target.result)) {
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

  const handleReset = async () => {
    if (confirm('本当にすべてのデータをリセットしますか？\nこの操作は取り消せません。')) {
      try {
        const ok = await resetData();
        if (ok) {
          alert('データをリセットしました');
          navigate('/admin/dashboard');
        } else {
          setDataMsg('❌ リセットに失敗しました');
        }
      } catch (e) {
        console.error('Reset data failed:', e);
        setDataMsg('❌ リセットに失敗しました');
      }
    }
  };

  const handleResetPoints = async () => {
    if (confirm('全員のポイントと履歴のみをゼロにしますか？\n(子どもやタスクの設定は残ります)\n\nこの操作は取り消せません！')) {
      try {
        await resetAllPoints();
        console.log('Reset all points successful');
        setDataMsg('✅ 全員のポイントリセットが完了しました');
        setChildren(getChildren()); // Refresh local list
        setTimeout(() => setDataMsg(''), 4000);
      } catch (e) {
        console.error('Reset all points failed:', e);
        setDataMsg('❌ リセットに失敗しました');
      }
    }
  };

  const handleResetIndividual = async () => {
    if (!resetChildId) return;
    const child = children.find(c => c.id === resetChildId);
    if (confirm(`${child.name}のポイントと履歴のみをゼロにしますか？\n\nこの操作は取り消せません！`)) {
      try {
        await resetChildPoints(resetChildId);
        console.log('Individual reset successful for:', resetChildId);
        setDataMsg(`✅ ${child.name}のリセットが完了しました`);
        setResetChildId('');
        setChildren(getChildren()); // Refresh local list
        setTimeout(() => setDataMsg(''), 4000);
      } catch (e) {
        console.error('Individual reset failed:', e);
        setDataMsg('❌ リセットに失敗しました');
      }
    }
  };

  return (
    <div className="page admin-page">
      <Header title="⚙️ 設定" showBack />

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>🔢 PIN変更</h3>
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
        <h3 style={{ marginBottom: 12 }}>🔑 パスキー管理</h3>
        {!passkeySupported ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
            この端末・ブラウザはパスキー（WebAuthn）をサポートしていません。
          </p>
        ) : (
          <div className="flex-col gap-8">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 4 }}>
              パスキーを登録すると、顔認証・指紋認証・画面ロック等で素早くログインや承認ができます（複数端末の登録に対応）。
            </p>

            {passkeyRegistered && (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: '0.85rem', color: '#2a7d56', fontWeight: 700, marginBottom: 8 }}>
                  ✅ パスキーが登録されています
                </p>
                {passkeys.length > 0 && (
                  <div className="flex-col gap-8" style={{ marginBottom: 8 }}>
                    {passkeys.map((pk, idx) => {
                      const id = typeof pk === 'string' ? pk : pk.id;
                      const name = typeof pk === 'string' ? `パスキー #${idx + 1}` : pk.name;
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #eee' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>🔑 {name}</span>
                          <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleDeletePasskey(id, name)}>削除</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                type="text"
                placeholder="パスキー名（例: パパのスマホ）"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                style={{ flex: 1, fontSize: '0.9rem' }}
              />
              <button className="btn btn-admin" style={{ whiteSpace: 'nowrap' }} onClick={handleRegisterPasskey}>
                ＋ パスキー追加
              </button>
            </div>

            {passkeyMsg && (
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: passkeyMsg.includes('✅') ? '#2a7d56' : 'var(--pink-dark)', marginTop: 4 }}>
                {passkeyMsg}
              </p>
            )}

            {passkeyRegistered && (
              <button className="btn btn-outline btn-full" style={{ marginTop: 8 }} onClick={handleClearPasskeys}>
                すべてのパスキーを解除する
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16, border: dataMsg ? '2px solid var(--mint)' : 'none' }}>
        <h3 style={{ marginBottom: 12 }}>💾 データ管理</h3>
        {dataMsg && (
          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: 12, borderRadius: 12, marginBottom: 16, fontWeight: 800, textAlign: 'center', animation: 'bounceIn 0.5s' }}>
            {dataMsg}
          </div>
        )}
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
