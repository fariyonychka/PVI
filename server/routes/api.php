<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

$uri = str_replace("/PVI/server/index.php", "", $uri);

if (str_contains($uri, '/api/login') && $method === 'POST') {
    require_once __DIR__ . '/../controllers/AuthController.php';
    AuthController::login();
} elseif (str_contains($uri, '/api/logout') && $method === 'POST') {
    require_once __DIR__ . '/../controllers/AuthController.php';
    AuthController::logout();
} elseif (str_contains($uri, '/api/user') && $method === 'GET') {
    require_once __DIR__ . '/../controllers/AuthController.php';
    AuthController::getUser();
} elseif (str_contains($uri, '/api/students')) {
    require_once __DIR__ . '/../controllers/StudentController.php';
    StudentController::handle($method);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found']);
}
