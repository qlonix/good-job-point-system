import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { getPin } from '../../data/store';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError(false);
    if (val && idx < 3) refs[idx + 1].current?.focus();
    if (next.every((d) => d !== '')) {
      const pin = next.join('');
      if (pin === getPin()) {
        navigate('/admin/dashboard');
      } else {
        setError(true);
        setDigits(['', '', '', '']);
        refs[0].current?.focus();
      }
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ marginBottom: 24 }}>
        <span className="emoji-xl">🔐</span>
      </div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 8 }}>管理画面</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 4 }}>PINコードを入力してください</p>

      <div className="pin-input">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            className="pin-digit"
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
          />
        ))}
      </div>

      {error && (
        <p style={{ color: 'var(--pink-dark)', fontWeight: 700, animation: 'wiggle 0.4s ease' }}>
          PINが違います
        </p>
      )}

      <button className="btn btn-outline" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
        ← もどる
      </button>
      <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-light)' }}>
        初期PIN: 0000
      </p>
    </div>
  );
}
