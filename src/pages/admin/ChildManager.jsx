import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Header from '../../components/Header';
import { getChildren, addChild, updateChild, deleteChild, adjustPoints, getTotalPoints } from '../../data/store';

const AVATARS = ['👧','👦','👶','🧒','👱','🐱','🐶','🐰','🦊','🐻','🐼','🦁'];

export default function ChildManager() {
  const navigate = useNavigate();
  const [children, setChildren] = useState(getChildren());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', avatar: '👧' });
  const [qrModal, setQrModal] = useState(null);
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ category: 'otetsudai', amount: 0 });

  const refresh = () => setChildren(getChildren());

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', avatar: '👧' });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, avatar: c.avatar });
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

  const printQr = (child) => {
    // get SVG from modal
    const svgElement = document.querySelector('.modal svg');
    const svgHtml = svgElement ? svgElement.outerHTML : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${child.name}のQRコード</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&display=swap');
        @page { size: A4 portrait; margin: 20mm; }
        body { 
          font-family: 'Nunito', sans-serif; 
          margin: 0; 
          background: white; 
        }
        .card { 
          background: #fffafb; 
          border-radius: 4mm; 
          padding: 5mm; 
          box-sizing: border-box;
          text-align: center; 
          width: 54mm; 
          height: 86mm; /* クレジットカードサイズ (縦向き) */
          border: 1.5px dashed #ff8fab; /* 切り取り線 */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        h1 { font-size: 9pt; color: #ff8fab; margin: 0; line-height: 1.2; }
        .emoji { font-size: 24pt; margin: 0; line-height: 1; }
        .name { font-size: 12pt; margin: 0; color: #4a3548; font-weight: 900; }
        .qr-container { display: flex; justify-content: center; align-items: center; background: white; padding: 2mm; border-radius: 2mm; }
        .qr-container svg { width: 34mm; height: 34mm; display: block; }
        .footer { font-size: 7pt; color: #8a7088; font-weight: 700; margin: 0; }
      </style>
      </head><body>
      <div class="card">
        <h1>⭐ がんばったねポイント</h1>
        <div class="emoji">${child.avatar}</div>
        <div class="name">${child.name}</div>
        <div class="qr-container">${svgHtml}</div>
        <div class="footer">カードをかざしてね！</div>
      </div>
      <script>
        setTimeout(function(){ window.print(); }, 500);
      <\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="page admin-page">
      <Header title="👧 子ども管理" showBack />

      <button className="btn btn-admin btn-full" onClick={openAdd}>+ 子どもを追加</button>

      <div className="admin-list">
        {children.length === 0 && (
          <div className="empty-state">
            <div className="empty-emoji">👶</div>
            <p>まだ子どもが登録されていません</p>
          </div>
        )}
        {children.map((c) => (
          <div key={c.id} className="admin-list-item">
            <span className="item-emoji">{c.avatar}</span>
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
            <h2>{qrModal.avatar} {qrModal.name} のQRコード</h2>
            <div style={{ margin: '20px auto', padding: 16, background: '#fff', borderRadius: 12, display: 'inline-block' }}>
              <QRCodeSVG value={`otetsudai:${qrModal.id}`} size={220} level="M" />
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
              <label className="label">アバター</label>
              <div className="emoji-grid">
                {AVATARS.map((a) => (
                  <button key={a} className={`emoji-option ${form.avatar === a ? 'selected' : ''}`} onClick={() => setForm({ ...form, avatar: a })}>
                    {a}
                  </button>
                ))}
              </div>
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
