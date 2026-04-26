import { useState } from 'react';
import { getPin } from '../data/store';
import { renderRuby } from '../utils/format';
import { authenticateBiometric, registerBiometric } from '../utils/auth';

const IS_WEBKIT = 'WebkitTextSecurity' in document.documentElement.style;

export default function ApprovalModal({ actionLabel, actionEmoji, childName, onApprove, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [mode, setMode] = useState('select'); // 'select' | 'pin'

  const handlePinSubmit = () => {
    if (pin === getPin()) {
      onApprove();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

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

      if (success) onApprove();
    } catch (e) {
      console.error('Biometric failed:', e);
      setMode('pin');
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

        {mode === 'select' && (
          <div className="flex-col gap-12">
            <button className="btn btn-pink btn-full btn-lg" onClick={handleBiometric}>
              🔐 顔や指で確認
            </button>
            <button className="btn btn-purple btn-full" onClick={() => setMode('pin')}>
              🔢 パスコードで確認
            </button>
            <button className="btn btn-outline btn-full" onClick={onCancel}>
              キャンセル
            </button>
          </div>
        )}

        {mode === 'pin' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 12 }}>
              パスコードを入力してください
            </p>
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
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              />
            </div>
            {error && (
              <p style={{ color: 'var(--pink-dark)', fontWeight: 700, marginBottom: 8, animation: 'wiggle 0.4s ease' }}>
                パスコードが違います
              </p>
            )}
            <div className="flex-col gap-8">
              <button className="btn btn-pink btn-full" onClick={handlePinSubmit}>
                確認 ✓
              </button>
              <button className="btn btn-outline btn-full" onClick={() => setMode('select')}>
                ← 戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
