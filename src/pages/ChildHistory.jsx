import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { getChildById } from '../data/store';
import { renderRuby } from '../utils/format';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CHILD_COLORS = ['#E91E63', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#795548'];

const generatePeriods = (period, startDate, endDate) => {
  const periods = [];
  let curr = new Date(startDate);
  const end = new Date(endDate);
  const spanDays = (end - curr) / (1000 * 60 * 60 * 24);
  const showYear = spanDays > 300;
  
  if (period === 'day') {
    curr.setHours(0, 0, 0, 0);
    while (curr <= end) {
      const label = showYear 
        ? `${curr.getFullYear().toString().slice(-2)}/${curr.getMonth() + 1}/${curr.getDate()}`
        : `${curr.getMonth() + 1}/${curr.getDate()}`;
      periods.push({ label, start: curr.getTime() });
      curr.setDate(curr.getDate() + 1);
    }
  } else if (period === 'week') {
    curr.setDate(curr.getDate() - curr.getDay());
    curr.setHours(0, 0, 0, 0);
    while (curr <= end) {
      const label = showYear
        ? `${curr.getFullYear().toString().slice(-2)}/${curr.getMonth() + 1}/${curr.getDate()}〜`
        : `${curr.getMonth() + 1}/${curr.getDate()}〜`;
      periods.push({ label, start: curr.getTime() });
      curr.setDate(curr.getDate() + 7);
    }
  } else if (period === 'month') {
    curr.setDate(1);
    curr.setHours(0, 0, 0, 0);
    while (curr <= end) {
      periods.push({ label: `${curr.getFullYear()}/${curr.getMonth() + 1}`, start: curr.getTime() });
      curr.setMonth(curr.getMonth() + 1);
    }
  }
  return periods;
};

const getPeriodKey = (isoString, period, startDate, endDate) => {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  const s = new Date(startDate);
  const e = new Date(endDate);
  const spanDays = (e - s) / (1000 * 60 * 60 * 24);
  const showYear = spanDays > 300;

  if (period === 'day') {
    return showYear
      ? `${d.getFullYear().toString().slice(-2)}/${d.getMonth() + 1}/${d.getDate()}`
      : `${d.getMonth() + 1}/${d.getDate()}`;
  } else if (period === 'week') {
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    return showYear
      ? `${startOfWeek.getFullYear().toString().slice(-2)}/${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}〜`
      : `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}〜`;
  } else if (period === 'month') {
    return `${d.getFullYear()}/${d.getMonth() + 1}`;
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card" style={{ padding: '10px', fontSize: '0.8rem', border: '1px solid #ddd', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', background: 'white', minWidth: '150px', pointerEvents: 'none' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: 'var(--pink-dark)', fontWeight: 'bold' }}>獲得:</span>
            <span style={{ fontWeight: 'bold' }}>+{payload.find(p => p.dataKey === 'earn')?.value || 0} pt</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: '#555', fontWeight: 'bold' }}>使用:</span>
            <span style={{ fontWeight: 'bold' }}>-{payload.find(p => p.dataKey === 'spend')?.value || 0} pt</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #eee', gap: 12 }}>
            <span style={{ color: '#ff7300', fontWeight: 'bold' }}>使用可能:</span>
            <span style={{ fontWeight: 'bold' }}>{payload.find(p => p.dataKey === 'cumulative')?.value || 0} pt</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function ChildHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Chart state
  const [chartPeriod, setChartPeriod] = useState('day');
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(todayStr);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [hiddenItems, setHiddenItems] = useState(new Set());

  // 日付や期間変更時にズームをリセット
  useEffect(() => {
    setZoomScale(1.0);
  }, [startDate, endDate, chartPeriod]);

  const child = getChildById(id);
  if (!child) return null; // Simplified for brevity as per store pattern

  const history = Array.isArray(child.history) ? child.history : [];

  const earned = history
    .filter((h) => h.type === 'earn')
    .reduce((sum, h) => sum + (h.points || 0), 0);
  const spent = history
    .filter((h) => h.type === 'spend')
    .reduce((sum, h) => sum + (h.points || 0), 0);

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
  );

  const formatDate = (iso) => {
    if (!iso) return '--/--';
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Calendar logic
  const calYear = currentMonth.getFullYear();
  const calMonth = currentMonth.getMonth() + 1;
  const startOfMonth = new Date(calYear, calMonth - 1, 1);
  const endOfMonth = new Date(calYear, calMonth, 0);
  const startDay = startOfMonth.getDay();

  const calDays = [];
  for (let i = 0; i < startDay; i++) calDays.push(null);
  for (let i = 1; i <= endOfMonth.getDate(); i++) {
    const datePrefix = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dailyEarned = history
      .filter((h) => h.type === 'earn' && typeof h.date === 'string' && h.date.startsWith(datePrefix))
      .reduce((sum, h) => sum + (h.points || 0), 0);
    const dailySpent = history
      .filter((h) => h.type === 'spend' && typeof h.date === 'string' && h.date.startsWith(datePrefix))
      .reduce((sum, h) => sum + (h.points || 0), 0);
    calDays.push({ day: i, earned: dailyEarned, spent: dailySpent });
  }

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  // Chart logic (copied from Admin logic but filtered for this child)
  const chartData = useMemo(() => {
    const periods = generatePeriods(chartPeriod, startDate, endDate);
    const firstPeriodStart = periods.length > 0 ? periods[0].start : 0;
    
    const dataMap = {};
    periods.forEach(p => {
      dataMap[p.label] = { name: p.label, earn: 0, spend: 0 };
    });

    let baseTotal = 0;
    history.forEach(h => {
      const dTime = new Date(h.date).getTime();
      const amt = h.type === 'earn' ? (h.points || 0) : -(h.points || 0);
      if (dTime < firstPeriodStart) {
        baseTotal += amt;
      }
      const pKey = getPeriodKey(h.date, chartPeriod, startDate, endDate);
      if (dataMap[pKey]) {
        dataMap[pKey][h.type] += (h.points || 0);
      }
    });

    let runningTotal = baseTotal;
    return periods.map(p => {
      const row = dataMap[p.label];
      runningTotal += row.earn;
      runningTotal -= row.spend;
      row.cumulative = runningTotal;
      return row;
    });
  }, [history, chartPeriod, startDate, endDate]);

  const toggleItem = (id) => {
    setHiddenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="page">
      <Header title={renderRuby('[履歴(りれき)]')} showBack />

      <div className="text-center" style={{ marginBottom: 16 }}>
        <div className="dashboard-avatar" style={{ width: 64, height: 64, margin: '0 auto 8px' }}>
          {child.avatarImage ? (
            <img src={child.avatarImage} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <span className="emoji-lg">{child.avatar}</span>
          )}
        </div>
        <h2 style={{ fontSize: '1.1rem' }}>{renderRuby(child.name)} の {renderRuby('[履歴(りれき)]')}</h2>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-around', padding: '12px 8px' }}>
        <div className="text-center">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{renderRuby('[合計獲得(ごうけいかくとく)]')}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--pink-dark)' }}>{earned}</div>
        </div>
        <div style={{ width: 1, background: '#eee' }} />
        <div className="text-center">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{renderRuby('[合計使用(ごうけいしよう)]')}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#555' }}>{spent}</div>
        </div>
      </div>

      <div className="tabs history-tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>📜 リスト</button>
        <button className={`tab ${view === 'graph' ? 'active' : ''}`} onClick={() => setView('graph')}>📊 グラフ</button>
        <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>📅 カレンダー</button>
      </div>

      <div style={{ paddingBottom: 40 }}>
        {view === 'list' && (
          <div className="history-list">
            {sortedHistory.length === 0 ? (
              <div className="empty-state"><div className="empty-emoji">📊</div><p>まだありません</p></div>
            ) : (
              sortedHistory.map((h) => (
                <div key={h.id} className="history-item card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.5rem' }}>{h.taskEmoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{renderRuby(h.taskName)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{formatDate(h.date)}</div>
                  </div>
                  <div className={`h-points ${h.type}`} style={{ fontWeight: 900, fontSize: '1.1rem' }}>
                    {h.type === 'earn' ? '+' : '−'}{h.points}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'calendar' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button className="btn btn-sm btn-outline" onClick={() => changeMonth(-1)}>◀</button>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>{calYear}年 {calMonth}月</h3>
              <button className="btn btn-sm btn-outline" onClick={() => changeMonth(1)}>▶</button>
            </div>
            <div className="calendar-grid">
              {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
                <div key={d} className="cal-day-head">{d}</div>
              ))}
              {calDays.map((d, i) => (
                <div key={i} className={`cal-day ${d ? '' : 'empty'}`}>
                  {d && (
                    <>
                      <span className="cal-num">{d.day}</span>
                      <div className="cal-vals">
                        {d.earned > 0 && <span className="cal-val earn">+{d.earned}</span>}
                        {d.spent > 0 && <span className="cal-val spend">-{d.spent}</span>}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'graph' && (
          <div className="card" style={{ padding: '16px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className={`btn btn-sm ${chartPeriod === 'day' ? 'btn-pink' : 'btn-outline'}`} onClick={() => setChartPeriod('day')}>日</button>
                <button className={`btn btn-sm ${chartPeriod === 'week' ? 'btn-pink' : 'btn-outline'}`} onClick={() => setChartPeriod('week')}>週</button>
                <button className={`btn btn-sm ${chartPeriod === 'month' ? 'btn-pink' : 'btn-outline'}`} onClick={() => setChartPeriod('month')}>月</button>
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input 
                  type="date" className="input" style={{ padding: '2px 4px', fontSize: '0.7rem', width: 'auto' }} 
                  value={startDate} 
                  onChange={e => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (endDate && val > endDate) setEndDate(val);
                  }} 
                />
                <span style={{ fontSize: '0.7rem' }}>〜</span>
                <input 
                  type="date" className="input" style={{ padding: '2px 4px', fontSize: '0.7rem', width: 'auto' }} 
                  value={endDate} 
                  onChange={e => {
                    const val = e.target.value;
                    setEndDate(val);
                    if (startDate && val < startDate) setStartDate(val);
                  }} 
                />
                <button 
                  className="btn btn-sm btn-outline" 
                  style={{ padding: '2px 6px', fontSize: '0.65rem', minWidth: 0 }}
                  onClick={() => { setStartDate(defaultStart); setEndDate(todayStr); }}
                >🔄</button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: 12 }}>
              <div style={{ width: `${zoomScale * 100}%`, minWidth: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    key={`${startDate}-${endDate}-${chartPeriod}`}
                    data={chartData} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#888' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#888' }} orientation="left" axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" tick={{ fontSize: 9, fill: '#888' }} orientation="right" axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    {!hiddenItems.has('bars') && <Bar yAxisId="left" dataKey="earn" fill="var(--pink-dark)" fillOpacity={0.6} isAnimationActive={false} />}
                    {!hiddenItems.has('bars') && <Bar yAxisId="left" dataKey="spend" fill="#8884d8" fillOpacity={0.6} isAnimationActive={false} />}
                    {!hiddenItems.has('cumulative') && <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#ff7300" strokeWidth={2} dot={false} isAnimationActive={false} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center' }}>
               <button className="btn btn-sm btn-outline" style={{ minWidth: 36 }} onClick={() => setZoomScale(Math.max(1, zoomScale - 0.5))}>➖</button>
               <button className="btn btn-sm btn-outline" style={{ fontSize: '0.7rem', borderStyle: 'dashed' }} onClick={() => setZoomScale(1)}>リセット</button>
               <button className="btn btn-sm btn-outline" style={{ minWidth: 36 }} onClick={() => setZoomScale(Math.min(4, zoomScale + 0.5))}>➕</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 15, marginTop: 12, fontSize: '0.7rem', color: '#666' }}>
               <span style={{ cursor: 'pointer', opacity: hiddenItems.has('bars') ? 0.3 : 1 }} onClick={() => toggleItem('bars')}>📊 棒:獲得/使用</span>
               <span style={{ cursor: 'pointer', opacity: hiddenItems.has('cumulative') ? 0.3 : 1 }} onClick={() => toggleItem('cumulative')}>📈 線:使用可能</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .h-points.earn { color: var(--pink-dark); }
        .h-points.spend { color: #555; }
        .history-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; background: #eee; padding: 4px; border-radius: 12px; }
        .history-tabs .tab { margin: 0; font-size: 0.75rem; padding: 8px 2px; white-space: nowrap; border-radius: 8px; border: none; background: transparent; color: #666; font-weight: 800; }
        .history-tabs .tab.active { background: white; color: var(--pink-dark); box-shadow: 0 2px 6px rgba(0,0,0,0.05); }

        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .cal-day-head { text-align: center; font-size: 0.75rem; font-weight: 800; color: var(--text-light); padding: 4px 0; }
        .cal-day { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px; position: relative; padding: 2px; }
        .cal-day.empty { background: transparent; }
        .cal-num { font-size: 0.8rem; font-weight: 700; color: #444; }
        .cal-vals { display: flex; flex-direction: column; align-items: center; line-height: 1; }
        .cal-val { font-size: 0.55rem; font-weight: 900; }
        .cal-val.earn { color: var(--pink-dark); }
        .cal-val.spend { color: #888; }
      `}</style>
    </div>
  );
}

