import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPin } from '../../data/store';
import { authenticatePasskey, checkPasskeySupport, isPasskeyRegistered } from '../../utils/auth';

const IS_WEBKIT = 'WebkitTextSecurity' in document.documentElement.style;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(isPasskeyRegistered());

  useEffect(() => {
    checkPasskeySupport().then(supported => {
      setPasskeySupported(supported);
      setPasskeyRegistered(isPasskeyRegistered());
    });
  }, []);

  const handlePasskey = async () => {
    setError('');
    try {
      const assertion = await authenticatePasskey();
      if (assertion) {
        sessionStorage.setItem('gj_admin_auth', 'true');
        navigate('/admin/dashboard');
      }
    } catch (e) {
      console.error('Passkey authentication failed:', e);
      setError('パスキー認証に失敗しました。PINでログインしてください。');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePinSubmit = () => {
    if (pin === getPin()) {
      sessionStorage.setItem('gj_admin_auth', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('PINが違います');
      setPin('');
      setTimeout(() => setError(''), 1500);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: 20 }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔐</div>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>管理画面</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>PINまたはパスキーで認証してください</p>

      <div style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
        {passkeySupported && passkeyRegistered && (
          <>
            <button className="btn btn-purple btn-full btn-lg" onClick={handlePasskey} style={{ padding: '16px', marginBottom: 16 }}>
              🔑 パスキーでログイン
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px', color: 'var(--text-light)', fontSize: '0.85rem' }}>
              <div style={{ flex: 1, height: 1, background: '#ddd' }} />
              <span>または PINを入力</span>
              <div style={{ flex: 1, height: 1, background: '#ddd' }} />
            </div>
          </>
        )}

        {(!passkeySupported || !passkeyRegistered) && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: 16 }}>
            PIN（4桁）を入力してください
          </p>
        )}

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
            autoFocus={!passkeyRegistered}
            onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
          />
        </div>

        {error && (
          <p style={{ color: 'var(--pink-dark)', fontWeight: 700, marginBottom: 16, animation: 'wiggle 0.4s ease' }}>
            {error}
          </p>
        )}

        <div className="flex-col gap-12">
          <button className="btn btn-pink btn-full btn-lg" onClick={handlePinSubmit}>
            🔢 PINでログイン ✓
          </button>
          <button className="btn btn-outline btn-full" onClick={() => navigate('/')}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
