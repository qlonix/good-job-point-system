import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';
import Header from '../../components/Header';
import { getChildren, addChild, updateChild, deleteChild, adjustPoints, getTotalPoints } from '../../data/store';
import { resizeImage } from '../../utils/image';

const AVATARS = ['👧','👦','👶','🧒','👱','🐱','🐶','🐰','🦊','🐻','🐼','🦁'];

export default function ChildManager() {
  const navigate = useNavigate();
  const [children, setChildren] = useState(getChildren());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', avatar: '👧', avatarImage: null, headerImage: null });
  const [qrModal, setQrModal] = useState(null);
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ category: 'otetsudai', amount: 0 });

  const refresh = () => setChildren(getChildren());

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', avatar: '👧', avatarImage: null, headerImage: null });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, avatar: c.avatar, avatarImage: c.avatarImage || null, headerImage: c.headerImage || null });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      updateChild(editing.id, form);
    } else {
      addChild(form);
    }
    setShowModal(false);
    refresh();
  };

  const handleDelete = (id) => {
    if (confirm('本当に削除しますか？')) {
      deleteChild(id);
      refresh();
    }
  };

  const handleAdjust = () => {
    if (!adjustModal || !adjustForm.amount) return;
    adjustPoints(adjustModal.id, adjustForm.category, Number(adjustForm.amount));
    setAdjustModal(null);
    refresh();
  };

  const handleImageUpload = async (e, field, maxSize) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await resizeImage(file, maxSize);
      setForm(prev => ({ ...prev, [field]: base64 }));
    } catch (err) {
      alert('画像の読み込みに失敗しました');
    }
  };

  const generateCardHtml = (child) => {
    const childUrl = `${window.location.origin}/child/${child.id}`;
    const svgHtml = renderToString(<QRCodeSVG value={childUrl} size={220} level="M" />);
    
    // Header image or fallback pattern
    const headerStyle = child.headerImage 
      ? `background-image: url('${child.headerImage}'); background-size: cover; background-position: center;`
      : `background: #ff8fab;`; // default solid color

    // Avatar image or emoji
    const avatarHtml = child.avatarImage 
      ? `<img src="${child.avatarImage}" class="avatar-img" />`
      : `<div class="emoji">${child.avatar}</div>`;

    return `
      <div class="card">
        <div class="card-header" style="${headerStyle}"></div>
        <div class="card-body">
          <div class="avatar-container">${avatarHtml}</div>
          <div class="name">${child.name}</div>
          <div class="qr-container">${svgHtml}</div>
          <div class="footer">カードをかざしてね！</div>
        </div>
      </div>
    `;
  };

  const executePrint = (cardsHtml) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <title>がんばったねポイントカード</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&display=swap');
        @page { size: A4 portrait; margin: 15mm; }
        body { 
          font-family: 'Nunito', sans-serif; 
          margin: 0; 
          background: white; 
          display: flex;
          flex-wrap: wrap;
          gap: 15mm;
          justify-content: flex-start;
          align-content: flex-start;
        }
        .card { 
          background: #fffafb; 
          border-radius: 4mm; 
          box-sizing: border-box;
          text-align: center; 
          width: 54mm; 
          height: 86mm; /* クレジットカードサイズ (縦向き) */
          border: 1.5px dashed #ff8fab; /* 切り取り線 */
          display: flex;
          flex-direction: column;
          overflow: hidden;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          position: relative;
        }
        .card-header {
          width: 100%;
          height: 30mm;
          background-color: #ff8fab;
        }
        .card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 4mm;
        }
        .avatar-container {
          width: 20mm;
          height: 20mm;
          border-radius: 50%;
          background: white;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-top: -12mm;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          z-index: 2;
        }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .emoji { font-size: 14pt; margin: 0; line-height: 1; }
        .name { font-size: 11pt; margin: 3mm 0; color: #4a3548; font-weight: 900; }
        .qr-container { display: flex; justify-content: center; align-items: center; background: white; padding: 2mm; border-radius: 2mm; margin-top: auto; }
        .qr-container svg { width: 28mm; height: 28mm; display: block; }
        .footer { font-size: 6pt; color: #8a7088; font-weight: 700; margin: 2mm 0; }
      </style>
      </head><body>
      ${cardsHtml}
      <script>
        setTimeout(function(){ window.print(); }, 500);
      <\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const printQr = (child) => {
    executePrint(generateCardHtml(child));
  };

  const printAllQr = () => {
    if (children.length === 0) return;
    const cardsHtml = children.map(generateCardHtml).join('');
    executePrint(cardsHtml);
  };

  return (
    <div className="page admin-page">
      <Header title="👧 子ども管理" showBack />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-admin" style={{ flex: 1 }} onClick={openAdd}>+ 子どもを追加</button>
        {children.length > 0 && (
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={printAllQr}>🖨 全員分を印刷</button>
        )}
      </div>

      <div className="admin-list">
        {children.length === 0 && (
          <div className="empty-state">
            <div className="empty-emoji">👶</div>
            <p>まだ子どもが登録されていません</p>
          </div>
        )}
        {children.map((c) => (
          <div key={c.id} className="admin-list-item">
            <span className="item-emoji">
              {c.avatarImage ? (
                <img src={c.avatarImage} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                c.avatar
              )}
            </span>
            <div className="item-info">
              <div className="item-name">{c.name}</div>
              <div className="item-sub">合計 {getTotalPoints(c)} pt</div>
            </div>
            <div className="item-actions">
              <button className="btn btn-sm btn-outline" onClick={() => setQrModal(c)} title="QRコード">📱</button>
              <button className="btn btn-sm btn-outline" onClick={() => setAdjustModal(c)} title="ポイント調整">±</button>
              <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)} title="編集">✏️</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)} title="削除">🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {qrModal && (
        <div className="modal-overlay" onClick={() => setQrModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h2>
              {qrModal.avatarImage ? (
                <img src={qrModal.avatarImage} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 8 }} />
              ) : (
                qrModal.avatar + ' '
              )}
              {qrModal.name} のQRコード
            </h2>
            <div style={{ margin: '20px auto', padding: 16, background: '#fff', borderRadius: 12, display: 'inline-block' }}>
              <QRCodeSVG value={`${window.location.origin}/child/${qrModal.id}`} size={220} level="M" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 4 }}>
                この子の固有URL:
              </p>
              <input 
                type="text" 
                className="input" 
                readOnly 
                value={`${window.location.origin}/child/${qrModal.id}`} 
                style={{ fontSize: '0.8rem', textAlign: 'center', backgroundColor: '#f0f0f0' }} 
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 16 }}>
              このQRコードを印刷してカードに貼り付けてください
            </p>
            <div className="flex-col gap-8">
              <button className="btn btn-admin btn-full" onClick={() => printQr(qrModal)}>
                🖨 印刷する
              </button>
              <button className="btn btn-outline btn-full" onClick={() => setQrModal(null)}>
                とじる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? '子どもを編集' : '子どもを追加'}</h2>
            <div className="form-group">
              <label className="label">名前</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="なまえ" />
            </div>
            <div className="form-group">
              <label className="label">アバター（絵文字 または 画像）</label>
              
              {form.avatarImage ? (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img src={form.avatarImage} alt="avatar preview" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--pink-main)' }} />
                  <div style={{ marginTop: 8 }}>
                    <button className="btn btn-sm btn-outline" onClick={() => setForm(p => ({ ...p, avatarImage: null }))}>画像を削除</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="emoji-grid" style={{ marginBottom: 12 }}>
                    {AVATARS.map((a) => (
                      <button key={a} className={`emoji-option ${form.avatar === a ? 'selected' : ''}`} onClick={() => setForm({ ...form, avatar: a })}>
                        {a}
                      </button>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label className="btn btn-sm btn-outline" style={{ display: 'inline-block', cursor: 'pointer' }}>
                      📷 好きな画像をアップロード
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'avatarImage', 200)} />
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="label">カード用ヘッダー画像 (任意)</label>
              {form.headerImage ? (
                <div style={{ textAlign: 'center' }}>
                  <img src={form.headerImage} alt="header preview" style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                  <button className="btn btn-sm btn-outline" onClick={() => setForm(p => ({ ...p, headerImage: null }))}>画像を削除</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px', border: '2px dashed #ccc', borderRadius: 8 }}>
                  <label style={{ cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    🌄 背景画像を選択
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'headerImage', 600)} />
                  </label>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>キャンセル</button>
              <button className="btn btn-admin" style={{ flex: 1 }} onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{adjustModal.avatar} {adjustModal.name} のポイント調整</h2>
            <div className="form-group">
              <label className="label">カテゴリ</label>
              <select className="input" value={adjustForm.category} onChange={(e) => setAdjustForm({ ...adjustForm, category: e.target.value })}>
                <option value="otetsudai">🧹 おてつだい</option>
                <option value="obenkyo">📚 おべんきょう</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">ポイント (マイナスで減算)</label>
              <input className="input" type="number" value={adjustForm.amount} onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setAdjustModal(null)}>キャンセル</button>
              <button className="btn btn-admin" style={{ flex: 1 }} onClick={handleAdjust}>調整する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
