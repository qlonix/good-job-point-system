import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { getPin } from '../../data/store';
import { authenticateBiometric, registerBiometric, checkBiometricSupport } from '../../utils/auth';

const IS_WEBKIT = 'WebkitTextSecurity' in document.documentElement.style;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [mode, setMode] = useState('select'); // 'select' | 'pin'
  const [bioSupported, setBioSupported] = useState(false);

  useEffect(() => {
    checkBiometricSupport().then(supported => {
      setBioSupported(supported);
      if (!supported) setMode('pin');
    });
  }, []);

  const handleBiometric = async () => {
    try {
      const storedId = localStorage.getItem('gj_credential_id');
      let success = false;
      if (storedId) {
        const assertion = await authenticateBiometric();
        if (assertion) success = true;
      } else {
        const credential = await registerBiometric();
        if (credential) success = true;
      }
      if (success) navigate('/admin/dashboard');
    } catch (e) {
      console.error('Biometric failed:', e);
      setMode('pin');
    }
  };

  const handlePinSubmit = () => {
    if (pin === getPin()) {
      navigate('/admin/dashboard');
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: 20 }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔐</div>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>管理画面</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>親の確認をおこないます</p>

      {mode === 'select' && (
        <div className="flex-col gap-12" style={{ width: '100%', maxWidth: 300 }}>
          <button className="btn btn-pink btn-full btn-lg" onClick={handleBiometric} style={{ padding: '16px' }}>
            🔐 顔や指で確認
          </button>
          <button className="btn btn-purple btn-full" onClick={() => setMode('pin')} style={{ padding: '12px' }}>
            🔢 パスコードで確認
          </button>
          <button className="btn btn-outline btn-full" onClick={() => navigate('/')}>
            キャンセル
          </button>
        </div>
      )}

      {mode === 'pin' && (
        <div style={{ width: '100%', maxWidth: 300, textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: 16 }}>
            パスコードを入力してください
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            <input
              className="input"
              type={IS_WEBKIT ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              style={{ width: 160, textAlign: 'center', fontSize: '1.8rem', fontWeight: 900, letterSpacing: 8, textIndent: 8, padding: 0, WebkitTextSecurity: 'disc', height: 60 }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
            />
          </div>
          {error && (
            <p style={{ color: 'var(--pink-dark)', fontWeight: 700, marginBottom: 16, animation: 'wiggle 0.4s ease' }}>
              パスコードが違います
            </p>
          )}
          <div className="flex-col gap-12">
            <button className="btn btn-pink btn-full btn-lg" onClick={handlePinSubmit}>
              ログイン ✓
            </button>
            {bioSupported && (
              <button className="btn btn-outline btn-full" onClick={() => setMode('select')}>
                ← 戻る
              </button>
            )}
            {!bioSupported && (
              <button className="btn btn-outline btn-full" onClick={() => navigate('/')}>
                キャンセル
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
