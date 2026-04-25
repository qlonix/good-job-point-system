const API_BASE = '/api';

let localData = {
  children: [],
  tasks: [],
  rewards: [],
  pin: '0000'
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
  return localData.children.find((c) => c.id === id) || null;
}

export async function addChild({ name, avatar }) {
  const child = await fetchApi('/children', {
    method: 'POST',
    body: JSON.stringify({ name, avatar }),
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

// ---------- PIN ----------

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

export async function resetData() {
  console.warn('Reset not supported via API client directly');
}
