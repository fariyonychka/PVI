<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    return json_encode($data);
}
