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
const DEFAULT_CATEGORIES = [
  { id: 'seikatsu', name: '[生活(せいかつ)]', emoji: '🏠', color: '#ff9a9e' },
  { id: 'otetsudai', name: 'おてつだい', emoji: '🧹', color: '#3db87a' },
  { id: 'obenkyo', name: 'おべんきょう', emoji: '📚', color: '#4fa8e0' }
];

const DEFAULT_TASKS = [
  { id: 't1', name: '[食器(しょっき)]を[片(かた)付(つ)]ける', emoji: '🍽️', points: 10, category: 'seikatsu' },
  { id: 't2', name: '[部屋(へや)]を[掃除(そうじ)]する', emoji: '🧹', points: 15, category: 'otetsudai' },
  { id: 't3', name: '[洗濯物(せんたくもの)]をたたむ', emoji: '👕', points: 10, category: 'otetsudai' },
  { id: 't4', name: 'ペットの[世話(せわ)]をする', emoji: '🐕', points: 10, category: 'otetsudai' },
  { id: 't5', name: 'ゴミを[出(だ)]す', emoji: '🗑️', points: 5, category: 'seikatsu' },
  { id: 't8', name: '[宿題(しゅくだい)]をやる', emoji: '📝', points: 15, category: 'obenkyo' },
  { id: 't9', name: '[本(ほん)]を[読(よ)]む', emoji: '📖', points: 10, category: 'obenkyo' },
  { id: 't10', name: '[漢字(かんじ)]の[練習(れんしゅう)]', emoji: '✍️', points: 10, category: 'obenkyo' },
];

const DEFAULT_REWARDS = [
  { id: 'r1', name: 'シール1[枚(まい)]', emoji: '⭐', cost: 20 },
  { id: 'r2', name: 'おやつ', emoji: '🍪', cost: 30 },
  { id: 'r3', name: 'ゲーム15[分(ふん)]', emoji: '🎮', cost: 50 },
  { id: 'r4', name: 'おこづかい100[円(えん)]', emoji: '💰', cost: 100 },
  { id: 'r5', name: 'すきなおでかけ', emoji: '🎡', cost: 200 },
];

const DEFAULT_DATA = {
  children: [],
  categories: DEFAULT_CATEGORIES,
  tasks: DEFAULT_TASKS,
  rewards: DEFAULT_REWARDS,
  avatar_emojis: ['👧','👦','👶','🧒','👱','🐱','🐶','🐰','🦊','🐻','🐼','🦁','🐮','🐷','🐵','🐧','🐙','🦋'],
  task_emojis: ['📝','📖','✍️','🔢','🎨','🎹','🧹','🧼','🍽️','🧺','🗑️','🌱','🐕','👟','🛌','🏫','🧪','📏','🏃','🧽'],
  reward_emojis: ['🍦','🍪','🍫','🍭','🍕','🎡','🎮','📺','🧸','📚','🎁','💰','🎟️','🎈','⭐','🎬','🏞️','🍱','🍰','⚽'],
  pin: '0000',
};

// Initialize if empty or missing fields
const row = db.prepare('SELECT data FROM store WHERE id = 1').get();
if (!row) {
  db.prepare('INSERT INTO store (id, data) VALUES (1, ?)').run(JSON.stringify(DEFAULT_DATA));
} else {
  const currentData = JSON.parse(row.data);
  let changed = false;
  
  // Fill in missing top-level fields
  for (const key in DEFAULT_DATA) {
    if (!currentData[key] || (Array.isArray(currentData[key]) && currentData[key].length === 0 && DEFAULT_DATA[key].length > 0)) {
      currentData[key] = DEFAULT_DATA[key];
      changed = true;
    }
  }
  
  if (changed) {
    db.prepare('UPDATE store SET data = ? WHERE id = 1').run(JSON.stringify(currentData));
  }
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
