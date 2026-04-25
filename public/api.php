<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dataFile = __DIR__ . '/data.json';

function generateId() {
    return uniqid() . substr(md5(mt_rand()), 0, 5);
}

$defaultData = [
    'children' => [],
    'tasks' => [
        ['id' => 't1', 'name' => '食器(しょっき)を片(かた)付(つ)ける', 'emoji' => '🍽️', 'points' => 10, 'category' => 'seikatsu'],
        ['id' => 't2', 'name' => '部屋(へや)を掃除(そうじ)する', 'emoji' => '🧹', 'points' => 15, 'category' => 'otetsudai'],
        ['id' => 't3', 'name' => '洗濯物(せんたくもの)をたたむ', 'emoji' => '👕', 'points' => 10, 'category' => 'otetsudai'],
        ['id' => 't4', 'name' => 'ペットの世話(せわ)をする', 'emoji' => '🐕', 'points' => 10, 'category' => 'otetsudai'],
        ['id' => 't5', 'name' => 'ゴミを出(だ)す', 'emoji' => '🗑️', 'points' => 5, 'category' => 'seikatsu'],
        ['id' => 't8', 'name' => '宿題(しゅくだい)をやる', 'emoji' => '📝', 'points' => 15, 'category' => 'obenkyo'],
        ['id' => 't9', 'name' => '本(ほん)を読(よ)む', 'emoji' => '📖', 'points' => 10, 'category' => 'obenkyo'],
        ['id' => 't10', 'name' => '漢字(かんじ)の練習(れんしゅう)', 'emoji' => '✍️', 'points' => 10, 'category' => 'obenkyo'],
    ],
    'rewards' => [
        ['id' => 'r1', 'name' => 'シール1枚(まい)', 'emoji' => '⭐', 'cost' => 20],
        ['id' => 'r2', 'name' => 'おやつ', 'emoji' => '🍪', 'cost' => 30],
        ['id' => 'r3', 'name' => 'ゲーム15分(ふん)', 'emoji' => '🎮', 'cost' => 50],
        ['id' => 'r4', 'name' => 'おこづかい100円(えん)', 'emoji' => '💰', 'cost' => 100],
    ],
    'categories' => [
        ['id' => 'seikatsu', 'name' => 'せいかつ', 'emoji' => '🏠', 'color' => '#ff9a9e'],
        ['id' => 'otetsudai', 'name' => 'おてつだい', 'emoji' => '🧹', 'color' => '#3db87a'],
        ['id' => 'obenkyo', 'name' => 'おべんきょう', 'emoji' => '📚', 'color' => '#4fa8e0']
    ],
    'emojis' => ['⭐','🍪','🎮','📺','💰','🎡','🍦','📚','🎨','🧸','🎶','🏊','🎂','🍕','🎪','🎠','🌟','🍫','🎯','🎈','🎁'],
    'pin' => '0000'
];

if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode($defaultData, JSON_UNESCAPED_UNICODE));
}

$data = json_decode(file_get_contents($dataFile), true);
if (!$data) $data = $defaultData;
else {
    if (!isset($data['categories'])) $data['categories'] = $defaultData['categories'];
    if (!isset($data['emojis'])) $data['emojis'] = $defaultData['emojis'];
}

function save() {
    global $dataFile, $data;
    file_put_contents($dataFile, json_encode($data, JSON_UNESCAPED_UNICODE));
}

$route = isset($_GET['route']) ? trim($_GET['route'], '/') : '';
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true);

function getTotalPoints($child) {
    if (!isset($child['points'])) return 0;
    return array_sum($child['points']);
}

// Router
if ($route === 'data' && $method === 'GET') {
    echo json_encode($data);
    exit;
}

if ($route === 'children' && $method === 'GET') {
    echo json_encode($data['children']);
    exit;
}

if ($route === 'children' && $method === 'POST') {
    $child = [
        'id' => generateId(),
        'name' => $body['name'],
        'avatar' => $body['avatar'] ?? '👧',
        'points' => ['otetsudai' => 0, 'obenkyo' => 0, 'seikatsu' => 0],
        'history' => []
    ];
    $data['children'][] = $child;
    save();
    echo json_encode($child);
    exit;
}

if (preg_match('/^children\/([^\/]+)$/', $route, $matches)) {
    $id = $matches[1];
    $idx = array_search($id, array_column($data['children'], 'id'));
    
    if ($method === 'GET') {
        echo json_encode($idx !== false ? $data['children'][$idx] : null);
        exit;
    }
    if ($method === 'PUT' && $idx !== false) {
        $data['children'][$idx] = array_merge($data['children'][$idx], $body);
        save();
        echo json_encode($data['children'][$idx]);
        exit;
    }
    if ($method === 'DELETE' && $idx !== false) {
        array_splice($data['children'], $idx, 1);
        save();
        echo json_encode(['success' => true]);
        exit;
    }
}

if (preg_match('/^children\/([^\/]+)\/points\/add$/', $route, $matches) && $method === 'POST') {
    $id = $matches[1];
    $taskId = $body['taskId'];
    $idx = array_search($id, array_column($data['children'], 'id'));
    $tIdx = array_search($taskId, array_column($data['tasks'], 'id'));
    
    if ($idx !== false && $tIdx !== false) {
        $task = $data['tasks'][$tIdx];
        $cat = $task['category'];
        if (!isset($data['children'][$idx]['points'][$cat])) $data['children'][$idx]['points'][$cat] = 0;
        $data['children'][$idx]['points'][$cat] += $task['points'];
        
        array_unshift($data['children'][$idx]['history'], [
            'id' => generateId(),
            'date' => date('c'),
            'taskName' => $task['name'],
            'taskEmoji' => $task['emoji'],
            'points' => $task['points'],
            'category' => $cat,
            'type' => 'earn'
        ]);
        save();
        echo json_encode(['child' => $data['children'][$idx], 'pointsAdded' => $task['points']]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
    }
    exit;
}

if (preg_match('/^children\/([^\/]+)\/points\/spend$/', $route, $matches) && $method === 'POST') {
    $id = $matches[1];
    $rewardId = $body['rewardId'];
    $idx = array_search($id, array_column($data['children'], 'id'));
    $rIdx = array_search($rewardId, array_column($data['rewards'], 'id'));
    
    if ($idx !== false && $rIdx !== false) {
        $reward = $data['rewards'][$rIdx];
        $child = &$data['children'][$idx];
        $total = getTotalPoints($child);
        
        if ($total < $reward['cost']) {
            echo json_encode(['success' => false, 'reason' => 'insufficient']);
            exit;
        }
        
        $remaining = $reward['cost'];
        foreach ($child['points'] as $cat => $val) {
            if ($remaining <= 0) break;
            $deduct = min($val, $remaining);
            $child['points'][$cat] -= $deduct;
            $remaining -= $deduct;
        }
        
        array_unshift($child['history'], [
            'id' => generateId(),
            'date' => date('c'),
            'taskName' => $reward['name'],
            'taskEmoji' => $reward['emoji'],
            'points' => $reward['cost'],
            'category' => 'reward',
            'type' => 'spend'
        ]);
        save();
        echo json_encode(['success' => true, 'child' => $child]);
    } else {
        echo json_encode(['success' => false, 'reason' => 'not_found']);
    }
    exit;
}

if (preg_match('/^children\/([^\/]+)\/points\/adjust$/', $route, $matches) && $method === 'POST') {
    $id = $matches[1];
    $cat = $body['category'];
    $amount = (int)$body['amount'];
    $idx = array_search($id, array_column($data['children'], 'id'));
    
    if ($idx !== false) {
        if (!isset($data['children'][$idx]['points'][$cat])) $data['children'][$idx]['points'][$cat] = 0;
        $data['children'][$idx]['points'][$cat] = max(0, $data['children'][$idx]['points'][$cat] + $amount);
        
        array_unshift($data['children'][$idx]['history'], [
            'id' => generateId(),
            'date' => date('c'),
            'taskName' => $amount >= 0 ? 'ポイント手動追加' : 'ポイント手動減算',
            'taskEmoji' => $amount >= 0 ? '➕' : '➖',
            'points' => abs($amount),
            'category' => $cat,
            'type' => $amount >= 0 ? 'earn' : 'spend'
        ]);
        save();
        echo json_encode($data['children'][$idx]);
    }
    exit;
}

if ($route === 'points/resetAll' && $method === 'POST') {
    foreach ($data['children'] as &$child) {
        $child['points'] = ['otetsudai' => 0, 'obenkyo' => 0, 'seikatsu' => 0];
        $child['history'] = [];
    }
    save();
    echo json_encode(['success' => true]);
    exit;
}

if ($route === 'tasks') {
    if ($method === 'GET') {
        $cat = $_GET['category'] ?? null;
        if ($cat) {
            echo json_encode(array_values(array_filter($data['tasks'], fn($t) => $t['category'] === $cat)));
        } else {
            echo json_encode($data['tasks']);
        }
        exit;
    }
    if ($method === 'POST') {
        $task = [
            'id' => generateId(),
            'name' => $body['name'],
            'emoji' => $body['emoji'] ?? '✨',
            'points' => $body['points'] ?? 5,
            'category' => $body['category']
        ];
        $data['tasks'][] = $task;
        save();
        echo json_encode($task);
        exit;
    }
}

if (preg_match('/^tasks\/([^\/]+)$/', $route, $matches)) {
    $id = $matches[1];
    $idx = array_search($id, array_column($data['tasks'], 'id'));
    if ($idx !== false) {
        if ($method === 'PUT') {
            $data['tasks'][$idx] = array_merge($data['tasks'][$idx], $body);
            save();
            echo json_encode($data['tasks'][$idx]);
        }
        if ($method === 'DELETE') {
            array_splice($data['tasks'], $idx, 1);
            save();
            echo json_encode(['success' => true]);
        }
    }
    exit;
}

if ($route === 'rewards') {
    if ($method === 'GET') {
        echo json_encode($data['rewards']);
        exit;
    }
    if ($method === 'POST') {
        $reward = [
            'id' => generateId(),
            'name' => $body['name'],
            'emoji' => $body['emoji'] ?? '🎁',
            'cost' => $body['cost'] ?? 10
        ];
        $data['rewards'][] = $reward;
        save();
        echo json_encode($reward);
        exit;
    }
}

if (preg_match('/^rewards\/([^\/]+)$/', $route, $matches)) {
    $id = $matches[1];
    $idx = array_search($id, array_column($data['rewards'], 'id'));
    if ($idx !== false) {
        if ($method === 'PUT') {
            $data['rewards'][$idx] = array_merge($data['rewards'][$idx], $body);
            save();
            echo json_encode($data['rewards'][$idx]);
        }
        if ($method === 'DELETE') {
            array_splice($data['rewards'], $idx, 1);
            save();
            echo json_encode(['success' => true]);
        }
    }
    exit;
}

if ($route === 'pin') {
    if ($method === 'GET') {
        echo json_encode(['pin' => $data['pin'] ?? '0000']);
        exit;
    }
    if ($method === 'POST') {
        $data['pin'] = $body['pin'];
        save();
        echo json_encode(['success' => true]);
        exit;
    }
}

if ($route === 'categories') {
    if ($method === 'GET') {
        echo json_encode($data['categories'] ?? []);
        exit;
    }
    if ($method === 'POST') {
        $data['categories'] = $body;
        save();
        echo json_encode(['success' => true]);
        exit;
    }
}

if ($route === 'emojis') {
    if ($method === 'GET') {
        echo json_encode($data['emojis'] ?? []);
        exit;
    }
    if ($method === 'POST') {
        $data['emojis'] = $body;
        save();
        echo json_encode(['success' => true]);
        exit;
    }
}

if ($route === 'tasks/reorder' && $method === 'POST') {
    $data['tasks'] = $body;
    save();
    echo json_encode(['success' => true]);
    exit;
}

if ($route === 'import' && $method === 'POST') {
    if (isset($body['children']) && isset($body['tasks'])) {
        $data = $body;
        save();
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data']);
    }
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found', 'route' => $route]);
