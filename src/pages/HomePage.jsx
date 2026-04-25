import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getChildById, getChildren } from '../data/store';

export default function HomePage() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const handleChildFound = (childId) => {
    const child = getChildById(childId);
    if (child) {
      navigate(`/child/${child.id}`);
    } else {
      setError('このQRコードは登録されていません');
      setTimeout(() => setError(''), 3000);
    }
  };

  const startScanner = async () => {
    setError('');
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // QR contains child ID like "otetsudai:CHILD_ID" or "https://gj.qlo.jp/child/CHILD_ID"
          const matchOld = decodedText.match(/^otetsudai:(.+)$/);
          const matchUrl = decodedText.match(/\/child\/(.+)$/);
          const childId = matchOld ? matchOld[1] : (matchUrl ? matchUrl[1] : null);
          
          if (childId) {
            scanner.stop().catch(() => {});
            html5QrRef.current = null;
            setScanning(false);
            handleChildFound(childId);
          }
        },
        () => {} // ignore scan errors
      );
    } catch (e) {
      setError('カメラを起動できませんでした。カメラの許可を確認してください。');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const children = getChildren();

  return (
    <div className="page">
      <Header title="がんばったねポイント" showAdmin />

      <div className="scanner-wrap">
        {!scanning ? (
          <>
            <div className="scanner-circle">
              <span className="emoji-xl">📷</span>
            </div>
            <h1 className="scanner-title">QRコードをよみとろう！</h1>
            <p className="scanner-sub">カードのQRコードをカメラにうつしてね</p>
            <button className="btn btn-pink btn-lg" onClick={startScanner}>
              📷 スキャンかいし
            </button>
          </>
        ) : (
          <>
            <div style={{ width: '100%', maxWidth: 350, borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <div id="qr-reader" ref={scannerRef} />
            </div>
            <p className="scanner-sub">QRコードをカメラにかざしてね 📱</p>
            <button className="btn btn-outline" onClick={stopScanner}>
              ✕ やめる
            </button>
          </>
        )}

        {error && (
          <div style={{ color: 'var(--pink-dark)', fontWeight: 700, marginTop: 8, animation: 'wiggle 0.4s ease' }}>
            {error}
          </div>
        )}

        {!scanning && children.length > 0 && (
          <div style={{ width: '100%', maxWidth: 360, marginTop: 16 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, textAlign: 'center' }}>
              または、なまえをえらんでね：
            </p>
            <div className="flex-col gap-8">
              {children.map((c) => (
                <button
                  key={c.id}
                  className="btn btn-outline btn-full"
                  onClick={() => navigate(`/child/${c.id}`)}
                >
                  {c.avatarImage ? (
                    <img src={c.avatarImage} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 8 }} />
                  ) : (
                    c.avatar + ' '
                  )}
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
