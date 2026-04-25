import { useState } from 'react';
import { getPin } from '../data/store';

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
    // Try Web Authentication API for biometric / device unlock
    try {
      if (window.PublicKeyCredential && navigator.credentials) {
        // Use a simple credential check via the device's screen lock
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { name: 'がんばったねポイント' },
            user: {
              id: new Uint8Array(16),
              name: 'parent',
              displayName: 'おやの にんしょう',
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 60000,
          },
        });
        if (credential) {
          onApprove();
        }
      } else {
        // Fallback to PIN
        setMode('pin');
      }
    } catch {
      // If biometric fails or is cancelled, fall back to PIN
      setMode('pin');
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🔓</div>
        <h2 style={{ marginBottom: 4 }}>おやのかくにん</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: 16 }}>
          <strong>{childName}</strong> が 「{actionEmoji} {actionLabel}」
        </p>

        {mode === 'select' && (
          <div className="flex-col gap-12">
            <button className="btn btn-pink btn-full btn-lg" onClick={handleBiometric}>
              🔐 かおやゆびでかくにん
            </button>
            <button className="btn btn-purple btn-full" onClick={() => setMode('pin')}>
              🔢 パスコードでかくにん
            </button>
            <button className="btn btn-outline btn-full" onClick={onCancel}>
              もどる
            </button>
          </div>
        )}

        {mode === 'pin' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 12 }}>
              パスコードをにゅうりょくしてね
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              <input
                className="input"
                type="tel"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                style={{ width: 140, textAlign: 'center', fontSize: '1.5rem', fontWeight: 900, letterSpacing: 8, WebkitTextSecurity: 'disc' }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              />
            </div>
            {error && (
              <p style={{ color: 'var(--pink-dark)', fontWeight: 700, marginBottom: 8, animation: 'wiggle 0.4s ease' }}>
                パスコードがちがいます
              </p>
            )}
            <div className="flex-col gap-8">
              <button className="btn btn-pink btn-full" onClick={handlePinSubmit}>
                かくにん ✓
              </button>
              <button className="btn btn-outline btn-full" onClick={() => setMode('select')}>
                ← もどる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
