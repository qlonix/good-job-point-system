<?php
$route = isset($_GET['route']) ? $_GET['route'] : '';
echo json_encode(['route' => $route, 'get' => $_GET, 'uri' => $_SERVER['REQUEST_URI']]);
