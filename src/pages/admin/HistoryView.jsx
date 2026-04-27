import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import { getChildren, deleteHistoryItem, updateHistoryItem, addManualHistory, getCategories } from '../../data/store';
import { renderRuby } from '../../utils/format';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const CHILD_COLORS = ['#E91E63', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#795548'];

const CustomTooltip = ({ active, payload, label, childrenList, isAll }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card" style={{ padding: '10px', fontSize: '0.8rem', border: '1px solid #ddd', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', background: 'white', minWidth: '180px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {isAll ? (
            childrenList.map((c, i) => {
              const earn = payload.find(p => p.dataKey === `${c.id}_earn`)?.value || 0;
              const spend = payload.find(p => p.dataKey === `${c.id}_spend`)?.value || 0;
              const cum = payload.find(p => p.dataKey === `${c.id}_cumulative`)?.value || 0;
              if (earn === 0 && spend === 0 && cum === 0) return null;
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', alignItems: 'center' }}>
                  <span style={{ color: CHILD_COLORS[i % CHILD_COLORS.length], fontWeight: 'bold' }}>{c.name}</span>
                  <span style={{ fontFamily: 'monospace' }}>
                    <span style={{ color: 'var(--pink-dark)' }}>+{String(earn).padStart(2, ' ')}</span>
                    <span style={{ color: '#888', margin: '0 2px' }}>/</span>
                    <span style={{ color: '#555' }}>-{String(spend).padStart(2, ' ')}</span>
                    <span style={{ marginLeft: '6px', color: '#999', fontSize: '0.7rem' }}>({cum})</span>
                  </span>
                </div>
              );
            })
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--pink-dark)', fontWeight: 'bold' }}>獲得:</span>
                  <span style={{ fontWeight: 'bold' }}>+{payload.find(p => p.dataKey === 'earn')?.value || 0} pt</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555', fontWeight: 'bold' }}>使用:</span>
                  <span style={{ fontWeight: 'bold' }}>-{payload.find(p => p.dataKey === 'spend')?.value || 0} pt</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #eee' }}>
                  <span style={{ color: '#ff7300', fontWeight: 'bold' }}>使用可能:</span>
                  <span style={{ fontWeight: 'bold' }}>{payload.find(p => p.dataKey === 'cumulative')?.value || 0} pt</span>
                </div>
             </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ childrenList, isAll, hiddenItems, toggleItem }) => {
  const isHidden = (id) => hiddenItems.has(id);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
      {isAll && (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem', padding: '0 10px' }}>
          {childrenList.map((c, i) => (
            <div 
              key={c.id} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                opacity: isHidden(c.id) ? 0.3 : 1,
                transition: 'opacity 0.2s',
                padding: '4px 8px',
                borderRadius: '12px',
                background: isHidden(c.id) ? '#eee' : 'rgba(0,0,0,0.03)'
              }}
              onClick={() => toggleItem(c.id)}
            >
              <div style={{ width: '10px', height: '10px', backgroundColor: CHILD_COLORS[i % CHILD_COLORS.length], borderRadius: '2px' }}></div>
              <span style={{ color: '#444', fontWeight: 'bold' }}>{c.name}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', color: '#666', fontSize: '0.75rem', marginTop: '5px' }}>
        <span 
          style={{ 
            cursor: 'pointer', opacity: isHidden('bars') ? 0.3 : 1, 
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: '4px', background: isHidden('bars') ? 'transparent' : '#f9f9f9'
          }}
          onClick={() => toggleItem('bars')}
        >
          📊 棒:獲得 / 使用
        </span>
        <span 
          style={{ 
            cursor: 'pointer', opacity: isHidden('cumulative') ? 0.3 : 1,
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: '4px', background: isHidden('cumulative') ? 'transparent' : '#f9f9f9'
          }}
          onClick={() => toggleItem('cumulative')}
        >
          📈 線:使用可能ポイント
        </span>
      </div>
    </div>
  );
};

const generatePeriods = (period) => {
  const periods = [];
  const now = new Date();
  if (period === 'day') {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      periods.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, start: d.getTime() });
    }
  } else if (period === 'week') {
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - (i * 7));
      periods.push({ label: `${d.getMonth() + 1}/${d.getDate()}〜`, start: d.getTime() });
    }
  } else if (period === 'month') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push({ label: `${d.getFullYear()}/${d.getMonth() + 1}`, start: d.getTime() });
    }
  }
  return periods;
};

const getPeriodKey = (isoString, period) => {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  if (period === 'day') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } else if (period === 'week') {
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    return `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}〜`;
  } else if (period === 'month') {
    return `${d.getFullYear()}/${d.getMonth() + 1}`;
  }
};

export default function HistoryView() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [children, setChildren] = useState(getChildren());
  const [selectedChild, setSelectedChild] = useState(searchParams.get('childId') || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [chartPeriod, setChartPeriod] = useState('day');
  const [editingItem, setEditingItem] = useState(null); // { childId, historyId, points }
  const [addingItem, setAddingItem] = useState(false);
  const baseCategories = getCategories();
  const manualCategories = [...baseCategories, { id: 'other', name: 'その他（カテゴリー集計外）' }];
  const [addForm, setAddForm] = useState({
    childId: children.length > 0 ? children[0].id : '',
    type: 'earn',
    points: 10,
    taskName: '',
    taskEmoji: '📝',
    category: manualCategories.length > 0 ? manualCategories[0].id : 'seikatsu'
  });

  // フィルタ状態をURLパラメータに同期 (任意だが使い勝手のため)
  useEffect(() => {
    const cid = searchParams.get('childId');
    if (cid) setSelectedChild(cid);
  }, [searchParams]);

  const allHistory = useMemo(() => 
    children.flatMap((c) =>
      (Array.isArray(c.history) ? c.history : []).map((h) => ({ ...h, childName: c.name, childAvatar: c.avatar, childAvatarImage: c.avatarImage, childId: c.id }))
    ).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  , [children]);

  const filtered = useMemo(() => 
    allHistory
      .filter((h) => selectedChild === 'all' || String(h.childId) === String(selectedChild))
      .filter((h) => typeFilter === 'all' || h.type === typeFilter)
  , [allHistory, selectedChild, typeFilter]);

  const stats = useMemo(() => {
    const earned = filtered.filter(h => h.type === 'earn').reduce((sum, h) => sum + (h.points || 0), 0);
    const spent = filtered.filter(h => h.type === 'spend').reduce((sum, h) => sum + (h.points || 0), 0);
    return { earned, spent };
  }, [filtered]);

  const chartData = useMemo(() => {
    const periods = generatePeriods(chartPeriod);
    const firstPeriodStart = periods.length > 0 ? periods[0].start : 0;
    
    const dataMap = {};
    periods.forEach(p => {
      dataMap[p.label] = { name: p.label, earn: 0, spend: 0 };
      children.forEach(c => {
        dataMap[p.label][`${c.id}_earn`] = 0;
        dataMap[p.label][`${c.id}_spend`] = 0;
      });
    });

    let baseTotal = 0;
    const baseChild = {};
    children.forEach(c => baseChild[c.id] = 0);

    filtered.forEach(h => {
      const dTime = new Date(h.date).getTime();
      if (dTime < firstPeriodStart) {
        const amt = h.type === 'earn' ? (h.points || 0) : -(h.points || 0);
        baseTotal += amt;
        baseChild[h.childId] += amt;
      }
      const pKey = getPeriodKey(h.date, chartPeriod);
      if (dataMap[pKey]) {
        dataMap[pKey][h.type] += (h.points || 0);
        dataMap[pKey][`${h.childId}_${h.type}`] += (h.points || 0);
      }
    });

    let runningTotal = baseTotal;
    const runningChild = { ...baseChild };

    return periods.map(p => {
      const row = dataMap[p.label];
      
      runningTotal += row.earn;
      runningTotal -= row.spend;
      row.cumulative = runningTotal;
      
      children.forEach(c => {
        runningChild[c.id] += row[`${c.id}_earn`];
        runningChild[c.id] -= row[`${c.id}_spend`];
        row[`${c.id}_cumulative`] = runningChild[c.id];
      });
      
      return row;
    });
  }, [filtered, chartPeriod, children]);

  const [zoom, setZoom] = useState({ start: 0, end: 1 });
  const [hiddenItems, setHiddenItems] = useState(new Set());
  const chartContainerRef = useRef(null);

  const toggleItem = (id) => {
    setHiddenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleZoom = (direction) => {
    setZoom(prev => {
      const size = prev.end - prev.start;
      const zoomFactor = direction === 'in' ? 0.7 : 1.4;
      const newSize = Math.max(0.1, Math.min(1.0, size * zoomFactor));
      const center = prev.start + size / 2;
      let ns = center - newSize / 2;
      let ne = center + newSize / 2;
      if (ns < 0) { ne -= ns; ns = 0; }
      if (ne > 1) { ns -= (ne - 1); ne = 1; }
      return { start: Math.max(0, ns), end: Math.min(1, ne) };
    });
  };

  const visibleData = useMemo(() => {
    if (chartData.length <= 5) return chartData;
    const startIdx = Math.floor(zoom.start * (chartData.length - 1));
    const endIdx = Math.ceil(zoom.end * (chartData.length - 1));
    return chartData.slice(Math.max(0, startIdx), Math.min(chartData.length, endIdx + 1));
  }, [chartData, zoom]);

  // Removed wheel/touch listeners as zoom is now button-based



  const handleDelete = async (childId, historyId) => {
    if (!confirm('この履歴を削除しますか？\n(削除すると、その分のポイントも自動的に調整されます)')) return;
    await deleteHistoryItem(childId, historyId);
    setChildren([...getChildren()]);
  };

  const handleUpdatePoints = async () => {
    if (!editingItem) return;
    await updateHistoryItem(editingItem.childId, editingItem.historyId, { points: editingItem.points });
    setEditingItem(null);
    setChildren([...getChildren()]);
  };

  const handleAddManual = async () => {
    if (!addForm.childId) return alert('子どもを選択してください');
    if (!addForm.taskName.trim()) return alert('内容を入力してください');
    
    // For type=spend, amount needs to be negative if we adjust points, wait, `points/adjust` uses Math.max(0, points + amount). 
    // If type === 'spend', amount must be negative so it deducts.
    const amount = addForm.type === 'earn' ? addForm.points : -Math.abs(addForm.points);
    
    await addManualHistory(addForm.childId, {
      amount,
      category: addForm.category,
      taskName: addForm.taskName,
      taskEmoji: addForm.taskEmoji,
      type: addForm.type
    });
    
    setAddingItem(false);
    setAddForm({ ...addForm, taskName: '', points: 10 });
    setChildren([...getChildren()]);
  };

  const formatDate = (iso) => {
    if (!iso) return '--/--';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '--/--';
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="page admin-page">
      <Header title="📊 ポイント履歴" showBack backTo={location.state?.backTo} />

      <div style={{ padding: '0 16px 16px', textAlign: 'right' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setAddingItem(true)}>
          ➕ 手動で追加
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', padding: '0 16px' }}>
        <select className="input" style={{ flex: 1, minWidth: 120 }} value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}>
          <option value="all">全員</option>
          {children.map((c) => (
            <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>
          ))}
        </select>
        <select className="input" style={{ flex: 1, minWidth: 120 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">すべて</option>
          <option value="earn">獲得のみ</option>
          <option value="spend">利用のみ</option>
        </select>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-around', padding: '12px 8px' }}>
        <div className="text-center">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>合計獲得</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--pink-dark)' }}>{stats.earned}</div>
        </div>
        <div style={{ width: 1, background: '#eee' }}></div>
        <div className="text-center">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>合計使用</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#555' }}>{stats.spent}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: '16px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={`btn btn-sm ${chartPeriod === 'day' ? 'btn-pink' : 'btn-outline'}`} onClick={() => setChartPeriod('day')}>日別</button>
            <button className={`btn btn-sm ${chartPeriod === 'week' ? 'btn-pink' : 'btn-outline'}`} onClick={() => setChartPeriod('week')}>週別</button>
            <button className={`btn btn-sm ${chartPeriod === 'month' ? 'btn-pink' : 'btn-outline'}`} onClick={() => setChartPeriod('month')}>月別</button>
          </div>
          <div style={{ width: 1, height: 20, background: '#eee' }}></div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-sm btn-outline" style={{ minWidth: 36 }} onClick={() => handleZoom('in')} title="拡大">➕</button>
            <button className="btn btn-sm btn-outline" style={{ minWidth: 36 }} onClick={() => handleZoom('out')} title="縮小">➖</button>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div ref={chartContainerRef} style={{ overflowX: 'hidden', paddingBottom: 8 }}>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={visibleData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#888' }} orientation="left" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" tick={{ fontSize: 10, fill: '#888' }} orientation="right" axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip childrenList={children} isAll={selectedChild === 'all'} />} />
                  {selectedChild === 'all' ? (
                    <>
                      {typeFilter !== 'spend' && !hiddenItems.has('bars') && children.map((c, i) => (
                        <Bar key={`earn_${c.id}`} yAxisId="left" dataKey={`${c.id}_earn`} stackId="earn" fill={CHILD_COLORS[i % CHILD_COLORS.length]} fillOpacity={0.6} hide={hiddenItems.has(c.id)} isAnimationActive={false} />
                      ))}
                      {typeFilter !== 'earn' && !hiddenItems.has('bars') && children.map((c, i) => (
                        <Bar key={`spend_${c.id}`} yAxisId="left" dataKey={`${c.id}_spend`} stackId="spend" fill={CHILD_COLORS[i % CHILD_COLORS.length]} fillOpacity={0.2} hide={hiddenItems.has(c.id)} isAnimationActive={false} />
                      ))}
                      {!hiddenItems.has('cumulative') && children.map((c, i) => (
                        <Line key={`cum_${c.id}`} yAxisId="right" type="monotone" dataKey={`${c.id}_cumulative`} stroke={CHILD_COLORS[i % CHILD_COLORS.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} hide={hiddenItems.has(c.id)} isAnimationActive={false} />
                      ))}
                    </>
                  ) : (
                    <>
                      {typeFilter !== 'spend' && !hiddenItems.has('bars') && <Bar yAxisId="left" dataKey="earn" name="獲得" fill="var(--pink-dark)" fillOpacity={0.6} radius={[4, 4, 0, 0]} isAnimationActive={false} />}
                      {typeFilter !== 'earn' && !hiddenItems.has('bars') && <Bar yAxisId="left" dataKey="spend" name="使用" fill="#8884d8" fillOpacity={0.6} radius={[4, 4, 0, 0]} isAnimationActive={false} />}
                      {!hiddenItems.has('cumulative') && <Line yAxisId="right" type="monotone" dataKey="cumulative" name="使用可能ポイント" stroke="#ff7300" strokeWidth={3} dot={{ r: 4, fill: '#ff7300', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} isAnimationActive={false} />}
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        {(zoom.start > 0 || zoom.end < 1) && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button 
              className="btn btn-sm btn-outline" 
              style={{ fontSize: '0.75rem', padding: '4px 12px', borderStyle: 'dashed', color: '#888' }}
              onClick={() => setZoom({ start: 0, end: 1 })}
            >
              🔄 ズーム解除（全体表示）
            </button>
          </div>
        )}
        <CustomLegend childrenList={children} isAll={selectedChild === 'all'} hiddenItems={hiddenItems} toggleItem={toggleItem} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-emoji">📊</div><p>履歴がありません</p></div>
      ) : (
        <div className="admin-history-list" style={{ paddingBottom: 40 }}>
          {filtered.slice(0, 100).map((h) => (
            <div key={h.id} className="history-item card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="h-emoji" style={{ fontSize: '1.5rem' }}>{h.taskEmoji}</span>
              <div className="h-info" style={{ flex: 1 }}>
                <div className="h-name" style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                  {h.childAvatarImage ? (
                    <img src={h.childAvatarImage} alt="avatar" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 4 }} />
                  ) : (
                    h.childAvatar + ' '
                  )}
                  {renderRuby(h.childName)} — {renderRuby(h.taskName)}
                </div>
                <div className="h-date" style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{formatDate(h.date)}</div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className={`h-points ${h.type}`} style={{ fontWeight: 900, fontSize: '1.1rem' }}>
                  {h.type === 'earn' ? '+' : '−'}{h.points}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-sm btn-outline" 
                    style={{ fontSize: '0.8rem', padding: '4px 8px', minWidth: 0 }}
                    onClick={() => setEditingItem({ childId: h.childId, historyId: h.id, points: h.points })}
                    title="ポイント修正"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn btn-sm btn-outline" 
                    style={{ fontSize: '0.8rem', padding: '4px 8px', minWidth: 0, color: 'var(--pink-dark)' }}
                    onClick={() => handleDelete(h.childId, h.id)}
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingItem && (
        <div className="modal-overlay">
          <div className="modal card">
            <h3>ポイント修正</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 16 }}>
              数値を変更すると、子どもの現在の所持ポイントも自動的に調整されます。
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button 
                className="btn btn-outline" 
                style={{ fontSize: '1.2rem', padding: '4px 16px' }}
                onClick={() => setEditingItem({ ...editingItem, points: Math.max(0, editingItem.points - 5) })}
              >−</button>
              <input 
                type="number" 
                className="input" 
                value={editingItem.points} 
                onChange={(e) => setEditingItem({ ...editingItem, points: parseInt(e.target.value) || 0 })}
                style={{ fontSize: '1.5rem', textAlign: 'center', flex: 1 }}
              />
              <button 
                className="btn btn-outline" 
                style={{ fontSize: '1.2rem', padding: '4px 16px' }}
                onClick={() => setEditingItem({ ...editingItem, points: editingItem.points + 5 })}
              >+</button>
            </div>
            <div className="flex gap-8">
              <button className="btn btn-outline flex-1" onClick={() => setEditingItem(null)}>キャンセル</button>
              <button className="btn btn-pink flex-1" onClick={handleUpdatePoints}>保存する</button>
            </div>
          </div>
        </div>
      )}

      {addingItem && (
        <div className="modal-overlay">
          <div className="modal card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16 }}>手動で履歴を追加</h3>
            
            <div className="flex-col gap-12">
              <div>
                <label className="point-label">対象の子ども</label>
                <select className="input" style={{ width: '100%' }} value={addForm.childId} onChange={e => setAddForm({...addForm, childId: e.target.value})}>
                  {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className={`btn flex-1 ${addForm.type === 'earn' ? 'btn-pink' : 'btn-outline'}`}
                  onClick={() => setAddForm({...addForm, type: 'earn'})}
                >➕ 加算</button>
                <button 
                  className={`btn flex-1 ${addForm.type === 'spend' ? 'btn-purple' : 'btn-outline'}`}
                  onClick={() => setAddForm({...addForm, type: 'spend'})}
                >➖ 減算</button>
              </div>

              <div>
                <label className="point-label">ポイント数</label>
                <input 
                  type="number" className="input" style={{ width: '100%' }} 
                  value={addForm.points} onChange={e => setAddForm({...addForm, points: parseInt(e.target.value) || 0})}
                  min={1}
                />
              </div>

              <div>
                <label className="point-label">対象カテゴリー</label>
                <select className="input" style={{ width: '100%' }} value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})}>
                  {manualCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 80 }}>
                  <label className="point-label">絵文字</label>
                  <input 
                    type="text" className="input" style={{ width: '100%', textAlign: 'center' }} 
                    value={addForm.taskEmoji} onChange={e => setAddForm({...addForm, taskEmoji: e.target.value})}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="point-label">内容</label>
                  <input 
                    type="text" className="input" style={{ width: '100%' }} 
                    placeholder="例: 特別なお手伝い"
                    value={addForm.taskName} onChange={e => setAddForm({...addForm, taskName: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setAddingItem(false)}>キャンセル</button>
              <button className="btn btn-pink" style={{ flex: 1 }} onClick={handleAddManual}>追加する</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .h-points.earn { color: var(--pink-dark); }
        .h-points.spend { color: #555; }
        .admin-history-list { padding-top: 4px; }
      `}</style>
    </div>
  );
}
