// ============================================================
// Data Store — localStorage wrapper for the point management app
// ============================================================

const STORAGE_KEY = 'otetsudai_point_app';

// ---------- Default seed data ----------

const DEFAULT_TASKS = [
  // おてつだい
  { id: 't1', name: '食器を片付ける', emoji: '🍽️', points: 10, category: 'otetsudai' },
  { id: 't2', name: '部屋を掃除する', emoji: '🧹', points: 15, category: 'otetsudai' },
  { id: 't3', name: '洗濯物をたたむ', emoji: '👕', points: 10, category: 'otetsudai' },
  { id: 't4', name: 'ペットの世話をする', emoji: '🐕', points: 10, category: 'otetsudai' },
  { id: 't5', name: 'ゴミを出す', emoji: '🗑️', points: 5, category: 'otetsudai' },
  { id: 't6', name: '料理を手伝う', emoji: '🍳', points: 15, category: 'otetsudai' },
  { id: 't7', name: '靴をそろえる', emoji: '👟', points: 5, category: 'otetsudai' },
  // おべんきょう
  { id: 't8', name: '宿題をやる', emoji: '📝', points: 15, category: 'obenkyo' },
  { id: 't9', name: '本を読む', emoji: '📖', points: 10, category: 'obenkyo' },
  { id: 't10', name: '漢字の練習', emoji: '✍️', points: 10, category: 'obenkyo' },
  { id: 't11', name: '計算ドリル', emoji: '🔢', points: 10, category: 'obenkyo' },
  { id: 't12', name: '英語の勉強', emoji: '🔤', points: 10, category: 'obenkyo' },
];

const DEFAULT_REWARDS = [
  { id: 'r1', name: 'シール1枚', emoji: '⭐', cost: 20 },
  { id: 'r2', name: 'おやつ', emoji: '🍪', cost: 30 },
  { id: 'r3', name: 'ゲーム15分', emoji: '🎮', cost: 50 },
  { id: 'r4', name: 'おこづかい100円', emoji: '💰', cost: 100 },
  { id: 'r5', name: 'すきなおでかけ', emoji: '🎡', cost: 200 },
];

const DEFAULT_DATA = {
  children: [],
  tasks: DEFAULT_TASKS,
  rewards: DEFAULT_REWARDS,
  pin: '0000',
};

// ---------- Helpers ----------

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_DATA };
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---------- Children ----------

export function getChildren() {
  return load().children;
}

export function getChildById(id) {
  return load().children.find((c) => c.id === id) || null;
}



export function addChild({ name, avatar }) {
  const data = load();
  const child = {
    id: generateId(),
    name,
    avatar: avatar || '👧',
    points: { otetsudai: 0, obenkyo: 0 },
    history: [],
  };
  data.children.push(child);
  save(data);
  return child;
}

export function updateChild(id, updates) {
  const data = load();
  const idx = data.children.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  data.children[idx] = { ...data.children[idx], ...updates };
  save(data);
  return data.children[idx];
}

export function deleteChild(id) {
  const data = load();
  data.children = data.children.filter((c) => c.id !== id);
  save(data);
}

// ---------- Points ----------

export function addPoints(childId, taskId) {
  const data = load();
  const child = data.children.find((c) => c.id === childId);
  const task = data.tasks.find((t) => t.id === taskId);
  if (!child || !task) return null;

  child.points[task.category] = (child.points[task.category] || 0) + task.points;
  child.history.unshift({
    id: generateId(),
    date: new Date().toISOString(),
    taskName: task.name,
    taskEmoji: task.emoji,
    points: task.points,
    category: task.category,
    type: 'earn',
  });
  save(data);
  return { child, pointsAdded: task.points };
}

export function getTotalPoints(child) {
  if (!child || !child.points) return 0;
  return Object.values(child.points).reduce((a, b) => a + b, 0);
}

export function spendPoints(childId, rewardId) {
  const data = load();
  const child = data.children.find((c) => c.id === childId);
  const reward = data.rewards.find((r) => r.id === rewardId);
  if (!child || !reward) return { success: false, reason: 'not_found' };

  const total = getTotalPoints(child);
  if (total < reward.cost) return { success: false, reason: 'insufficient', shortage: reward.cost - total };

  // Deduct proportionally from categories
  let remaining = reward.cost;
  const categories = Object.keys(child.points);
  for (const cat of categories) {
    if (remaining <= 0) break;
    const deduct = Math.min(child.points[cat], remaining);
    child.points[cat] -= deduct;
    remaining -= deduct;
  }

  child.history.unshift({
    id: generateId(),
    date: new Date().toISOString(),
    taskName: reward.name,
    taskEmoji: reward.emoji,
    points: reward.cost,
    category: 'reward',
    type: 'spend',
  });
  save(data);
  return { success: true, child };
}

export function adjustPoints(childId, category, amount) {
  const data = load();
  const child = data.children.find((c) => c.id === childId);
  if (!child) return null;
  child.points[category] = Math.max(0, (child.points[category] || 0) + amount);
  child.history.unshift({
    id: generateId(),
    date: new Date().toISOString(),
    taskName: amount >= 0 ? 'ポイント手動追加' : 'ポイント手動減算',
    taskEmoji: amount >= 0 ? '➕' : '➖',
    points: Math.abs(amount),
    category,
    type: amount >= 0 ? 'earn' : 'spend',
  });
  save(data);
  return child;
}

// ---------- Tasks ----------

export function getTasks(category) {
  const data = load();
  if (category) return data.tasks.filter((t) => t.category === category);
  return data.tasks;
}

export function addTask({ name, emoji, points, category }) {
  const data = load();
  const task = { id: generateId(), name, emoji: emoji || '✨', points: points || 5, category };
  data.tasks.push(task);
  save(data);
  return task;
}

export function updateTask(id, updates) {
  const data = load();
  const idx = data.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  data.tasks[idx] = { ...data.tasks[idx], ...updates };
  save(data);
  return data.tasks[idx];
}

export function deleteTask(id) {
  const data = load();
  data.tasks = data.tasks.filter((t) => t.id !== id);
  save(data);
}

// ---------- Rewards ----------

export function getRewards() {
  return load().rewards;
}

export function addReward({ name, emoji, cost }) {
  const data = load();
  const reward = { id: generateId(), name, emoji: emoji || '🎁', cost: cost || 10 };
  data.rewards.push(reward);
  save(data);
  return reward;
}

export function updateReward(id, updates) {
  const data = load();
  const idx = data.rewards.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  data.rewards[idx] = { ...data.rewards[idx], ...updates };
  save(data);
  return data.rewards[idx];
}

export function deleteReward(id) {
  const data = load();
  data.rewards = data.rewards.filter((r) => r.id !== id);
  save(data);
}

// ---------- PIN ----------

export function getPin() {
  return load().pin || '0000';
}

export function setPin(newPin) {
  const data = load();
  data.pin = newPin;
  save(data);
}

// ---------- Data Management ----------

export function exportData() {
  return JSON.stringify(load(), null, 2);
}

export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    save(data);
    return true;
  } catch {
    return false;
  }
}

export function resetData() {
  save({ ...DEFAULT_DATA });
}
