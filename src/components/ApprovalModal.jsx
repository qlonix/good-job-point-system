import { useState, useEffect } from 'react';
import { getPin } from '../data/store';
import { renderRuby } from '../utils/format';
import { authenticatePasskey, isPasskeyRegistered, checkPasskeySupport } from '../utils/auth';

const IS_WEBKIT = 'WebkitTextSecurity' in document.documentElement.style;

export default function ApprovalModal({ actionLabel, actionEmoji, childName, onApprove, onCancel }) {
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

  const handlePinSubmit = () => {
    if (pin === getPin()) {
      onApprove();
    } else {
      setError('PINが違います');
      setPin('');
      setTimeout(() => setError(''), 1500);
    }
  };

  const handlePasskey = async () => {
    setError('');
    try {
      const assertion = await authenticatePasskey();
      if (assertion) {
        onApprove();
      }
    } catch (e) {
      console.error('Passkey authentication failed:', e);
      setError('パスキー認証に失敗しました。PINで確認してください。');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🔓</div>
        <h2 style={{ marginBottom: 4 }}>親の確認</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: 16 }}>
          <strong>{renderRuby(childName)}</strong> が 「{actionEmoji} {renderRuby(actionLabel)}」
        </p>

        {passkeySupported && passkeyRegistered && (
          <>
            <button className="btn btn-purple btn-full btn-lg" onClick={handlePasskey} style={{ marginBottom: 12 }}>
              🔑 パスキーで承認
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 12px', color: 'var(--text-light)', fontSize: '0.8rem' }}>
              <div style={{ flex: 1, height: 1, background: '#ddd' }} />
              <span>または PINを入力</span>
              <div style={{ flex: 1, height: 1, background: '#ddd' }} />
            </div>
          </>
        )}

        <div>
          {(!passkeySupported || !passkeyRegistered) && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 12 }}>
              PIN（4桁）を入力してください
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            <input
              className="input"
              type={IS_WEBKIT ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              style={{ width: 140, textAlign: 'center', fontSize: '1.5rem', fontWeight: 900, letterSpacing: 8, textIndent: 8, padding: 0, WebkitTextSecurity: 'disc' }}
              autoFocus={!passkeyRegistered}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
            />
          </div>
          {error && (
            <p style={{ color: 'var(--pink-dark)', fontWeight: 700, marginBottom: 8, animation: 'wiggle 0.4s ease' }}>
              {error}
            </p>
          )}
          <div className="flex-col gap-8">
            <button className="btn btn-pink btn-full" onClick={handlePinSubmit}>
              🔢 PINで承認 ✓
            </button>
            <button className="btn btn-outline btn-full" onClick={onCancel}>
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
