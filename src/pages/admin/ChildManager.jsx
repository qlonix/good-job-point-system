import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Header from '../../components/Header';
import CropImageModal from '../../components/CropImageModal';
import { getChildren, addChild, updateChild, deleteChild, reorderChildren, adjustPoints, getTotalPoints, getCategories, getEmojis } from '../../data/store';
import { resizeImage } from '../../utils/image';

function SortableChildItem({ child, navigate, setQrModal, openEdit, handleDelete, getTotalPoints }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: child.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="admin-list-item">
      <div className="item-main">
        <div className="drag-handle" {...attributes} {...listeners}>⋮⋮</div>
        <span className="item-emoji">
          {child.avatarImage ? (
            <img src={child.avatarImage} alt="avatar" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--pink-light)' }} />
          ) : (
            child.avatar
          )}
        </span>
        <div className="item-info">
          <div className="item-name">{renderRuby(child.name)}</div>
          <div className="item-sub">合計 {getTotalPoints(child)} pt</div>
        </div>
      </div>
      <div className="item-actions">
        <button className="btn btn-sm btn-outline" onClick={() => setQrModal(child)} title="QRコード">📱</button>
        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/admin/history?childId=${child.id}`, { state: { backTo: '/admin/children' } })} title="ポイント履歴/調整">📊</button>
        <button className="btn btn-sm btn-outline" onClick={() => openEdit(child)} title="編集">✏️</button>
        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(child.id)} title="削除">🗑</button>
      </div>
    </div>
  );
}

export default function ChildManager() {
  const navigate = useNavigate();
  const categories = getCategories();
  const emojis = getEmojis('avatar');
  const [children, setChildren] = useState(getChildren());
  const [showModal, setShowModal] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const refresh = () => setChildren([...getChildren()]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = children.findIndex((c) => c.id === active.id);
      const newIndex = children.findIndex((c) => c.id === over.id);
      const newOrder = arrayMove(children, oldIndex, newIndex);
      setChildren(newOrder);
      await reorderChildren(newOrder);
    }
  };
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', avatar: '👧', avatarImage: null, headerImage: null });
  const [qrModal, setQrModal] = useState(null);
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ category: categories[0]?.id || '', amount: 0 });
  const [cropConfig, setCropConfig] = useState(null);

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

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await updateChild(editing.id, form);
    } else {
      await addChild(form);
    }
    setShowModal(false);
    refresh();
  };

  const handleDelete = async (id) => {
    if (confirm('本当に削除しますか？')) {
      await deleteChild(id);
      refresh();
    }
  };

  const handleAdjust = async () => {
    if (!adjustModal || !adjustForm.amount) return;
    await adjustPoints(adjustModal.id, adjustForm.category, Number(adjustForm.amount));
    setAdjustModal(null);
    refresh();
  };

  const handleImageUpload = (e, field, aspect, maxSize) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropConfig({ imageSrc: reader.result, aspect, maxSize, field });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const generateCardHtml = (child) => {
    const childUrl = `${window.location.origin}${window.location.pathname}#/child/${child.id}`;
    const svgHtml = renderToString(<QRCodeSVG value={childUrl} size={220} level="M" />);
    
    // Header image or fallback pattern
    const headerStyle = child.headerImage 
      ? `background-image: url('${child.headerImage}'); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, #ff8fab, #ffc2d4);`;

    // Avatar image or emoji
    const avatarHtml = child.avatarImage 
      ? `<img src="${child.avatarImage}" class="avatar-img" />`
      : `<div class="emoji">${child.avatar}</div>`;

    return `
      <div class="card">
        <div class="card-title-bar">
          <span class="star">★</span> がんばったねポイントカード <span class="star">★</span>
        </div>
        <div class="card-header" style="${headerStyle}"></div>
        <div class="card-body">
          <div class="avatar-container">${avatarHtml}</div>
          <div class="name">${child.name}</div>
          <div class="qr-container">${svgHtml}</div>
          <div class="footer">QRコードをよみとってね！</div>
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
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&family=M+PLUS+Rounded+1c:wght@700;900&display=swap');
        @page { size: A4 landscape; margin: 0; }
        body { 
          font-family: 'M PLUS Rounded 1c', 'Nunito', sans-serif; 
          margin: 0;
          padding: 8mm;
          background: white; 
          display: flex;
          flex-wrap: wrap;
          gap: 6mm 10mm;
          justify-content: flex-start;
          align-content: flex-start;
        }
        .card { 
          background: #ffeaef; 
          border-radius: 3mm; 
          box-sizing: border-box;
          text-align: center; 
          width: 54mm; 
          height: 86mm; 
          border: 1px solid #ffc2d4;
          box-shadow: 0 1mm 3mm rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          position: relative;
          page-break-inside: avoid;
        }
        .card-title-bar {
          width: 100%;
          height: 9mm;
          background-color: #fff9fb;
          border-bottom: 0.5mm solid #ffc2d4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 6.5pt;
          font-weight: 900;
          color: #e05c82;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }
        .star { color: #ffb347; font-size: 6pt; margin: 0 1mm; }
        .card-header {
          width: 100%;
          height: 25mm;
          flex-shrink: 0;
          display: block;
          position: relative;
          background-repeat: no-repeat;
          background-size: cover;
          background-position: top center;
        }
        .card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 4mm;
          position: relative;
        }
        .avatar-container {
          width: 16mm;
          height: 16mm;
          border-radius: 50%;
          background: white;
          border: 1mm solid white;
          box-shadow: 0 0.8mm 2mm rgba(0,0,0,0.1);
          margin-top: -8mm;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          z-index: 5;
        }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .emoji { font-size: 11pt; margin: 0; line-height: 1; }
        .name { font-size: 11pt; margin: 1.5mm 0; color: #4a3548; font-weight: 900; }
        .qr-container { 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          background: white; 
          padding: 1mm; 
          border-radius: 2mm; 
          margin-top: auto; 
          border: 0.5mm solid #ffebf0;
        }
        .qr-container svg { width: 22mm; height: 22mm; display: block; }
        .footer { font-size: 6pt; color: #ff8fab; font-weight: 900; margin: 1.5mm 0; }
      </style>
      </head><body>
      ${cardsHtml}
      <script>
        setTimeout(function(){ window.print(); }, 800);
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

      <div className="admin-top-btns">
        <button className="btn btn-admin" onClick={openAdd}>+ 子どもを追加</button>
        {children.length > 0 && (
          <button className="btn btn-outline" onClick={printAllQr}>🖨 全員分を印刷</button>
        )}
      </div>

      <div className="admin-list">
        {children.length === 0 && (
          <div className="empty-state">
            <div className="empty-emoji">👶</div>
            <p>まだ子どもが登録されていません</p>
          </div>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={children.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {children.map((c) => (
              <SortableChildItem
                key={c.id}
                child={c}
                navigate={navigate}
                setQrModal={setQrModal}
                openEdit={openEdit}
                handleDelete={handleDelete}
                getTotalPoints={getTotalPoints}
              />
            ))}
          </SortableContext>
        </DndContext>
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
              {renderRuby(qrModal.name)} のQRコード
            </h2>
            <div style={{ margin: '20px auto', padding: 16, background: '#fff', borderRadius: 12, display: 'inline-block' }}>
              <QRCodeSVG value={`${window.location.origin}${window.location.pathname}#/child/${qrModal.id}`} size={220} level="M" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 4 }}>
                この子の固有URL:
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <input 
                  type="text" 
                  className="input" 
                  readOnly 
                  value={`${window.location.origin}${window.location.pathname}#/child/${qrModal.id}`} 
                  style={{ fontSize: '0.8rem', textAlign: 'center', backgroundColor: '#f0f0f0', flex: 1 }} 
                />
                <button 
                  className="btn btn-sm btn-outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/child/${qrModal.id}`);
                    alert('URLをコピーしました！');
                  }}
                >
                  📋 コピー
                </button>
              </div>
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
            <h2>{editing ? `${renderRuby(editing.name)} を編集` : '子どもを追加'}</h2>
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
                    {emojis.slice(0, 20).map((a) => (
                      <button key={a} className={`emoji-option ${form.avatar === a ? 'selected' : ''}`} onClick={() => setForm({ ...form, avatar: a })}>
                        {a}
                      </button>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label className="btn btn-sm btn-outline" style={{ display: 'inline-block', cursor: 'pointer' }}>
                      📷 好きな画像をアップロード
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'avatarImage', 1, 200)} />
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="label">ヘッダー画像 (任意)</label>
              {form.headerImage ? (
                <div style={{ textAlign: 'center' }}>
                  <img src={form.headerImage} alt="header preview" style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                  <button className="btn btn-sm btn-outline" onClick={() => setForm(p => ({ ...p, headerImage: null }))}>画像を削除</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px', border: '2px dashed #ccc', borderRadius: 8 }}>
                  <label style={{ cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    🌄 背景画像を選択
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'headerImage', 1.5, 600)} />
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
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
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

      {/* Crop Modal */}
      {cropConfig && (
        <CropImageModal
          imageSrc={cropConfig.imageSrc}
          aspect={cropConfig.aspect}
          maxSize={cropConfig.maxSize}
          onCropComplete={(base64) => {
            setForm(prev => ({ ...prev, [cropConfig.field]: base64 }));
            setCropConfig(null);
          }}
          onCancel={() => setCropConfig(null)}
        />
      )}
    </div>
  );
}
