const API_BASE = '/api';

let localData = {
  children: [],
  tasks: [],
  rewards: [],
  pin: '0000',
  passkeys: []
};

async function fetchApi(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

// ---------- Initialization ----------

export async function initStore() {
  try {
    localData = await fetchApi('/data');
  } catch (e) {
    console.error('Failed to load data from server:', e);
  }
}

// ---------- Children ----------

export function getChildren() {
  return localData.children;
}

export function getChildById(id) {
  return localData.children.find((c) => String(c.id) === String(id)) || null;
}

export async function addChild({ name, avatar, avatarImage = null, headerImage = null }) {
  const child = await fetchApi('/children', {
    method: 'POST',
    body: JSON.stringify({ name, avatar, avatarImage, headerImage }),
  });
  localData.children.push(child);
  return child;
}

export async function updateChild(id, updates) {
  const updated = await fetchApi(`/children/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  const idx = localData.children.findIndex(c => c.id === id);
  if (idx !== -1) localData.children[idx] = updated;
  return updated;
}

export async function deleteChild(id) {
  await fetchApi(`/children/${id}`, { method: 'DELETE' });
  localData.children = localData.children.filter(c => c.id !== id);
}

export async function reorderChildren(newOrder) {
  await fetchApi('/children/reorder', {
    method: 'POST',
    body: JSON.stringify(newOrder),
  });
  localData.children = newOrder;
}

// ---------- Points ----------

export async function addPoints(childId, taskId) {
  const res = await fetchApi(`/children/${childId}/points/add`, {
    method: 'POST',
    body: JSON.stringify({ taskId }),
  });
  const idx = localData.children.findIndex(c => c.id === childId);
  if (idx !== -1) localData.children[idx] = res.child;
  return res;
}

export function getTotalPoints(child) {
  if (!child || !child.points) return 0;
  return Object.values(child.points).reduce((a, b) => a + b, 0);
}

export async function spendPoints(childId, rewardId) {
  const res = await fetchApi(`/children/${childId}/points/spend`, {
    method: 'POST',
    body: JSON.stringify({ rewardId }),
  });
  if (res.success) {
    const idx = localData.children.findIndex(c => c.id === childId);
    if (idx !== -1) localData.children[idx] = res.child;
  }
  return res;
}

export async function adjustPoints(childId, category, amount) {
  const res = await fetchApi(`/children/${childId}/points/adjust`, {
    method: 'POST',
    body: JSON.stringify({ category, amount }),
  });
  const idx = localData.children.findIndex(c => c.id === childId);
  if (idx !== -1) localData.children[idx] = res;
  return res;
}

export async function addManualHistory(childId, { amount, category, taskName, taskEmoji, type }) {
  const res = await fetchApi(`/children/${childId}/points/adjust`, {
    method: 'POST',
    body: JSON.stringify({ amount, category, taskName, taskEmoji, type }),
  });
  const idx = localData.children.findIndex(c => c.id === childId);
  if (idx !== -1) localData.children[idx] = res;
  return res;
}

// ---------- Tasks ----------

export function getTasks(category) {
  if (category) return localData.tasks.filter((t) => t.category === category);
  return localData.tasks;
}

export async function addTask({ name, emoji, points, category }) {
  const task = await fetchApi('/tasks', {
    method: 'POST',
    body: JSON.stringify({ name, emoji, points, category }),
  });
  localData.tasks.push(task);
  return task;
}

export async function updateTask(id, updates) {
  const updated = await fetchApi(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  const idx = localData.tasks.findIndex(t => t.id === id);
  if (idx !== -1) localData.tasks[idx] = updated;
  return updated;
}

export async function deleteTask(id) {
  await fetchApi(`/tasks/${id}`, { method: 'DELETE' });
  localData.tasks = localData.tasks.filter(t => t.id !== id);
}

// ---------- Rewards ----------

export function getRewards() {
  return localData.rewards;
}

export async function addReward({ name, emoji, cost }) {
  const reward = await fetchApi('/rewards', {
    method: 'POST',
    body: JSON.stringify({ name, emoji, cost }),
  });
  localData.rewards.push(reward);
  return reward;
}

export async function updateReward(id, updates) {
  const updated = await fetchApi(`/rewards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  const idx = localData.rewards.findIndex(r => r.id === id);
  if (idx !== -1) localData.rewards[idx] = updated;
  return updated;
}

export async function deleteReward(id) {
  await fetchApi(`/rewards/${id}`, { method: 'DELETE' });
  localData.rewards = localData.rewards.filter(r => r.id !== id);
}

export async function reorderRewards(newRewards) {
  await fetchApi('/rewards/reorder', { method: 'POST', body: JSON.stringify(newRewards) });
  localData.rewards = newRewards;
}

// ---------- PIN & Passkeys ----------

export function getPin() {
  return localData.pin || '0000';
}

export async function setPin(newPin) {
  await fetchApi('/pin', {
    method: 'POST',
    body: JSON.stringify({ pin: newPin }),
  });
  localData.pin = newPin;
}

export function getPasskeys() {
  return localData.passkeys || [];
}

export async function savePasskeys(passkeys) {
  await fetchApi('/passkeys', {
    method: 'POST',
    body: JSON.stringify(passkeys),
  });
  localData.passkeys = passkeys;
}

// ---------- Data Management ----------

export async function exportData() {
  const data = await fetchApi('/data');
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    await fetchApi('/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localData = data;
    return true;
  } catch {
    return false;
  }
}

// 全データを初期状態にリセットする
export async function resetData() {
  const defaultData = {
    children: [],
    categories: [
      { id: 'seikatsu', name: '[生活(せいかつ)]', emoji: '🏠', color: '#ff9a9e' },
      { id: 'otetsudai', name: 'おてつだい', emoji: '🧹', color: '#3db87a' },
      { id: 'obenkyo', name: 'おべんきょう', emoji: '📚', color: '#4fa8e0' },
    ],
    tasks: [
      { id: 't1', name: '[食器(しょっき)]を[片(かた)付(つ)]ける', emoji: '🍽️', points: 10, category: 'seikatsu' },
      { id: 't2', name: '[部屋(へや)]を[掃除(そうじ)]する', emoji: '🧹', points: 15, category: 'otetsudai' },
      { id: 't3', name: '[洗濯物(せんたくもの)]をたたむ', emoji: '👕', points: 10, category: 'otetsudai' },
      { id: 't4', name: 'ペットの[世話(せわ)]をする', emoji: '🐕', points: 10, category: 'otetsudai' },
      { id: 't5', name: 'ゴミを[出(だ)]す', emoji: '🗑️', points: 5, category: 'seikatsu' },
      { id: 't8', name: '[宿題(しゅくだい)]をやる', emoji: '📝', points: 15, category: 'obenkyo' },
      { id: 't9', name: '[本(ほん)]を[読(よ)]む', emoji: '📖', points: 10, category: 'obenkyo' },
      { id: 't10', name: '[漢字(かんじ)]の[練習(れんしゅう)]', emoji: '✍️', points: 10, category: 'obenkyo' },
    ],
    rewards: [
      { id: 'r1', name: 'シール1[枚(まい)]', emoji: '⭐', cost: 20 },
      { id: 'r2', name: 'おやつ', emoji: '🍪', cost: 30 },
      { id: 'r3', name: 'ゲーム15[分(ふん)]', emoji: '🎮', cost: 50 },
      { id: 'r4', name: 'おこづかい100[円(えん)]', emoji: '💰', cost: 100 },
      { id: 'r5', name: 'すきなおでかけ', emoji: '🎡', cost: 200 },
    ],
    avatar_emojis: ['👧','👦','👶','🧒','👱','🐱','🐶','🐰','🦊','🐻','🐼','🦁','🐮','🐷','🐵','🐧','🐙','🦋'],
    task_emojis: ['📝','📖','✍️','🔢','🎨','🎹','🧹','🧼','🍽️','🧺','🗑️','🌱','🐕','👟','🛌','🏫','🧪','📏','🏃','🧽'],
    reward_emojis: ['🍦','🍪','🍫','🍭','🍕','🎡','🎮','📺','🧸','📚','🎁','💰','🎟️','🎈','⭐','🎬','🏞️','🍱','🍰','⚽'],
    pin: '0000',
    passkeys: [],
  };
  localStorage.removeItem('gj_credential_id');
  return await importData(JSON.stringify(defaultData));
}

export async function resetAllPoints() {
  const data = await fetchApi('/data');
  const cats = data.categories || [];
  data.children.forEach(child => {
    const p = {};
    cats.forEach(c => p[c.id] = 0);
    child.points = p;
    child.history = [];
  });
  await importData(JSON.stringify(data));
}

export async function resetChildPoints(childId) {
  const data = await fetchApi('/data');
  const child = data.children.find(c => String(c.id) === String(childId));
  if (child) {
    const cats = data.categories || [];
    const p = {};
    cats.forEach(c => p[c.id] = 0);
    child.points = p;
    child.history = [];
    await importData(JSON.stringify(data));
  }
}

// ---------- Dynamic Categories & Emojis ----------

export function getCategories() {
  return localData.categories || [];
}

export async function saveCategories(categories) {
  await fetchApi('/categories', { method: 'POST', body: JSON.stringify(categories) });
  localData.categories = categories;
}

export function getEmojis(type = 'task') {
  let key = 'task_emojis';
  if (type === 'avatar') key = 'avatar_emojis';
  if (type === 'reward') key = 'reward_emojis';
  return localData[key] || [];
}

export async function saveEmojis(emojis, type = 'task') {
  await fetchApi(`/emojis?type=${type}`, { method: 'POST', body: JSON.stringify(emojis) });
  let key = 'task_emojis';
  if (type === 'avatar') key = 'avatar_emojis';
  if (type === 'reward') key = 'reward_emojis';
  localData[key] = emojis;
}

export async function reorderTasks(newTasks) {
  await fetchApi('/tasks/reorder', { method: 'POST', body: JSON.stringify(newTasks) });
  localData.tasks = newTasks;
}

export async function deleteHistoryItem(childId, historyId) {
  const res = await fetchApi(`/children/${childId}/history/${historyId}`, { method: 'DELETE' });
  const idx = localData.children.findIndex(c => c.id === childId);
  if (idx !== -1) localData.children[idx] = res.child;
  return res.child;
}

export async function updateHistoryItem(childId, historyId, updates) {
  const res = await fetchApi(`/children/${childId}/history/${historyId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  const idx = localData.children.findIndex(c => c.id === childId);
  if (idx !== -1) localData.children[idx] = res.child;
  return res.child;
}

