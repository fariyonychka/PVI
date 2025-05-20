<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$path = $_SERVER['REQUEST_URI'];
if (str_contains($path, '/api/')) {
    require_once './routes/api.php';
    exit;
}

require_once './PVI/index.html';
