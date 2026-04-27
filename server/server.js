import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { load, save, generateId } from './db.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Helpers to mirror the old store.js exact logic
function getTotalPoints(child) {
  if (!child || !child.points) return 0;
  return Object.values(child.points).reduce((a, b) => a + b, 0);
}

// Routes
app.get('/api/data', (req, res) => {
  res.json(load());
});

app.get('/api/children', (req, res) => {
  res.json(load().children);
});

app.get('/api/children/:id', (req, res) => {
  const child = load().children.find(c => c.id === req.params.id);
  res.json(child || null);
});

app.post('/api/children', (req, res) => {
  const { name, avatar } = req.body;
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
  res.json(child);
});

app.post('/api/children/reorder', (req, res) => {
  const data = load();
  data.children = req.body;
  save(data);
  res.json({ success: true });
});

app.put('/api/children/:id', (req, res) => {
  const data = load();
  const idx = data.children.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.children[idx] = { ...data.children[idx], ...req.body };
  save(data);
  res.json(data.children[idx]);
});

app.delete('/api/children/:id', (req, res) => {
  const data = load();
  data.children = data.children.filter(c => c.id !== req.params.id);
  save(data);
  res.json({ success: true });
});

app.post('/api/children/reorder', (req, res) => {
  const data = load();
  data.children = req.body;
  save(data);
  res.json({ success: true });
});

app.post('/api/children/:id/points/add', (req, res) => {
  const { taskId } = req.body;
  const data = load();
  const child = data.children.find(c => c.id === req.params.id);
  const task = data.tasks.find(t => t.id === taskId);
  
  if (!child || !task) return res.status(404).json({ error: 'Child or Task not found' });

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
  res.json({ child, pointsAdded: task.points });
});

app.post('/api/children/:id/points/spend', (req, res) => {
  const { rewardId } = req.body;
  const data = load();
  const child = data.children.find(c => c.id === req.params.id);
  const reward = data.rewards.find(r => r.id === rewardId);
  
  if (!child || !reward) return res.json({ success: false, reason: 'not_found' });

  const total = getTotalPoints(child);
  if (total < reward.cost) {
    return res.json({ success: false, reason: 'insufficient', shortage: reward.cost - total });
  }

  const deductions = {};
  let remaining = reward.cost;
  // Get categories from data to ensure we iterate in a stable order
  const cats = data.categories ? data.categories.map(c => c.id) : Object.keys(child.points);
  
  for (const cat of cats) {
    if (remaining <= 0) break;
    const current = child.points[cat] || 0;
    if (current <= 0) continue;
    const deduct = Math.min(current, remaining);
    child.points[cat] -= deduct;
    remaining -= deduct;
    deductions[cat] = deduct;
  }
  
  // If still remaining (negative points allowed if total balance was sufficient but categories were weird)
  if (remaining > 0) {
    const firstCat = cats[0] || 'seikatsu';
    child.points[firstCat] = (child.points[firstCat] || 0) - remaining;
    deductions[firstCat] = (deductions[firstCat] || 0) + remaining;
  }

  child.history.unshift({
    id: generateId(),
    date: new Date().toISOString(),
    taskName: reward.name,
    taskEmoji: reward.emoji,
    points: reward.cost,
    category: 'reward',
    type: 'spend',
    deductions // Store for undo
  });
  save(data);
  res.json({ success: true, child });
});

app.post('/api/children/:id/points/adjust', (req, res) => {
  const { category, amount } = req.body;
  const data = load();
  const child = data.children.find(c => c.id === req.params.id);
  if (!child) return res.status(404).json({ error: 'Not found' });
  
  child.points[category] = Math.max(0, (child.points[category] || 0) + amount);
  child.history.unshift({
    id: generateId(),
    date: new Date().toISOString(),
    taskName: req.body.taskName ?? (amount >= 0 ? 'ポイント手動追加' : 'ポイント手動減算'),
    taskEmoji: req.body.taskEmoji ?? (amount >= 0 ? '➕' : '➖'),
    points: Math.abs(amount),
    category,
    type: req.body.type ?? (amount >= 0 ? 'earn' : 'spend'),
  });
  save(data);
  res.json(child);
});

app.get('/api/tasks', (req, res) => {
  const { category } = req.query;
  const data = load();
  if (category) {
    res.json(data.tasks.filter(t => t.category === category));
  } else {
    res.json(data.tasks);
  }
});

app.post('/api/tasks', (req, res) => {
  const { name, emoji, points, category } = req.body;
  const data = load();
  const task = { id: generateId(), name, emoji: emoji || '✨', points: points || 5, category };
  data.tasks.push(task);
  save(data);
  res.json(task);
});

app.post('/api/tasks/reorder', (req, res) => {
  const data = load();
  data.tasks = req.body;
  save(data);
  res.json({ success: true });
});

app.put('/api/tasks/:id', (req, res) => {
  const data = load();
  const idx = data.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.tasks[idx] = { ...data.tasks[idx], ...req.body };
  save(data);
  res.json(data.tasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const data = load();
  data.tasks = data.tasks.filter(t => t.id !== req.params.id);
  save(data);
  res.json({ success: true });
});

app.get('/api/rewards', (req, res) => {
  res.json(load().rewards);
});

app.post('/api/rewards', (req, res) => {
  const { name, emoji, cost } = req.body;
  const data = load();
  const reward = { id: generateId(), name, emoji: emoji || '🎁', cost: cost || 10 };
  data.rewards.push(reward);
  save(data);
  res.json(reward);
});

app.post('/api/rewards/reorder', (req, res) => {
  const data = load();
  data.rewards = req.body;
  save(data);
  res.json({ success: true });
});

app.put('/api/rewards/:id', (req, res) => {
  const data = load();
  const idx = data.rewards.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.rewards[idx] = { ...data.rewards[idx], ...req.body };
  save(data);
  res.json(data.rewards[idx]);
});

app.delete('/api/rewards/:id', (req, res) => {
  const data = load();
  data.rewards = data.rewards.filter(r => r.id !== req.params.id);
  save(data);
  res.json({ success: true });
});


app.post('/api/categories', (req, res) => {
  const data = load();
  data.categories = req.body;
  save(data);
  res.json({ success: true });
});

app.post('/api/emojis', (req, res) => {
  const { type } = req.query;
  const data = load();
  let key = 'task_emojis';
  if (type === 'avatar') key = 'avatar_emojis';
  if (type === 'reward') key = 'reward_emojis';
  data[key] = req.body;
  save(data);
  res.json({ success: true });
});

app.get('/api/pin', (req, res) => {
  res.json({ pin: load().pin || '0000' });
});

app.post('/api/pin', (req, res) => {
  const data = load();
  data.pin = req.body.pin;
  save(data);
  res.json({ success: true });
});

app.post('/api/import', (req, res) => {
  try {
    const data = req.body;
    if (data && data.children && data.tasks) {
      save(data);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid data' });
    }
  } catch (e) {
    res.status(400).json({ error: 'Import failed' });
  }
});

app.delete('/api/children/:id/history/:historyId', (req, res) => {
  const data = load();
  const child = data.children.find(c => c.id === req.params.id);
  if (!child) return res.status(404).json({ error: 'Child not found' });

  const hIdx = child.history.findIndex(h => h.id === req.params.historyId);
  if (hIdx === -1) return res.status(404).json({ error: 'History not found' });

  const item = child.history[hIdx];
  const amt = item.points || 0;
  
  if (item.type === 'earn') {
    child.points[item.category] = Math.max(0, (child.points[item.category] || 0) - amt);
  } else if (item.type === 'spend') {
    if (item.deductions) {
      // Restore specific categories
      for (const [cat, val] of Object.entries(item.deductions)) {
        child.points[cat] = (child.points[cat] || 0) + val;
      }
    } else {
      // Fallback for old items
      child.points[item.category || 'seikatsu'] = (child.points[item.category] || 0) + amt;
    }
  }

  child.history.splice(hIdx, 1);
  save(data);
  res.json({ success: true, child });
});

app.put('/api/children/:id/history/:historyId', (req, res) => {
  const { points } = req.body;
  const data = load();
  const child = data.children.find(c => c.id === req.params.id);
  if (!child) return res.status(404).json({ error: 'Child not found' });

  const hIdx = child.history.findIndex(h => h.id === req.params.historyId);
  if (hIdx === -1) return res.status(404).json({ error: 'History not found' });

  const item = child.history[hIdx];
  const diff = points - item.points;

  if (item.type === 'earn') {
    child.points[item.category] = (child.points[item.category] || 0) + diff;
  } else if (item.type === 'spend') {
    child.points[item.category] = (child.points[item.category] || 0) - diff;
  }

  item.points = points;
  save(data);
  res.json({ success: true, child });
});

app.post('/api/points/resetAll', (req, res) => {
  const data = load();
  data.children.forEach(c => {
    c.points = {};
    if (data.categories) {
      data.categories.forEach(cat => c.points[cat.id] = 0);
    }
    c.history = [];
  });
  save(data);
  res.json({ success: true });
});

app.post('/api/children/:id/points/reset', (req, res) => {
  const data = load();
  const child = data.children.find(c => c.id === req.params.id);
  if (!child) return res.status(404).json({ error: 'Child not found' });

  // Completely wipe points and re-initialize
  child.points = {};
  if (data.categories) {
    data.categories.forEach(cat => {
      child.points[cat.id] = 0;
    });
  }
  child.history = [];
  
  save(data);
  res.json({ success: true, child });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API Server running on port ${port}`);
});
