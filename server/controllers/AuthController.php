<?php
require_once __DIR__ . '/../models/Auth.php';
require_once __DIR__ . '/../views/jsonResponse.php';

class AuthController {
    public static function login() {
        $data = json_decode(file_get_contents("php://input"), true);
        $result = Auth::login($data['login'], $data['password']);
        echo jsonResponse($result);
    }

    public static function logout() {
        session_destroy();
        echo jsonResponse(["success" => true]);
    }
}
