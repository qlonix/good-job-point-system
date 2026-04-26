import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'data.sqlite'));

db.pragma('journal_mode = WAL');

// Simple document store for simplicity and backward compatibility
db.exec(`
  CREATE TABLE IF NOT EXISTS store (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data JSON
  );
`);

// Default data from store.js
const DEFAULT_TASKS = [
  { id: 't1', name: '食器を片付ける', emoji: '🍽️', points: 10, category: 'otetsudai' },
  { id: 't2', name: '部屋を掃除する', emoji: '🧹', points: 15, category: 'otetsudai' },
  { id: 't3', name: '洗濯物をたたむ', emoji: '👕', points: 10, category: 'otetsudai' },
  { id: 't4', name: 'ペットの世話をする', emoji: '🐕', points: 10, category: 'otetsudai' },
  { id: 't5', name: 'ゴミを出す', emoji: '🗑️', points: 5, category: 'otetsudai' },
  { id: 't6', name: '料理を手伝う', emoji: '🍳', points: 15, category: 'otetsudai' },
  { id: 't7', name: '靴をそろえる', emoji: '👟', points: 5, category: 'otetsudai' },
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
  avatar_emojis: ['👧','👦','👶','🧒','👱','🐱','🐶','🐰','🦊','🐻','🐼','🦁','🐮','🐷','🐵','🐧','🐙','🦋'],
  task_emojis: ['📝','📖','✍️','🔢','🎨','🎹','🧹','🧼','🍽️','🧺','🗑️','🌱','🐕','👟','🛌','🏫','🧪','📏','🏃','🧽'],
  reward_emojis: ['🍦','🍪','🍫','🍭','🍕','🎡','🎮','📺','🧸','📚','🎁','💰','🎟️','🎈','⭐','🎬','🏞️','🍱','🍰','⚽'],
  pin: '0000',
};

// Initialize if empty
const row = db.prepare('SELECT data FROM store WHERE id = 1').get();
if (!row) {
  db.prepare('INSERT INTO store (id, data) VALUES (1, ?)').run(JSON.stringify(DEFAULT_DATA));
}

// Helpers
export function load() {
  const r = db.prepare('SELECT data FROM store WHERE id = 1').get();
  return JSON.parse(r.data);
}

export function save(data) {
  db.prepare('UPDATE store SET data = ? WHERE id = 1').run(JSON.stringify(data));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
