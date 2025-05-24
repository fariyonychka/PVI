<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../models/Auth.php';
require_once __DIR__ . '/../views/jsonResponse.php';

class AuthController {
    public static function login() {
        $data = json_decode(file_get_contents("php://input"), true);
        $result = Auth::login($data['login'], $data['password']);
        echo jsonResponse($result);
    }
    

    public static function logout() {
        global $pdo;
        if (isset($_SESSION['user'])) {
        $login = $_SESSION['user']['login'];
        $year = $_SESSION['user']['birth_year'];

        // Оновити статус студента на 'inactive'
        $updateStmt = $pdo->prepare("
            UPDATE students 
            SET status = 'inactive' 
            WHERE first_name = :name 
              AND YEAR(birthday) = :year
        ");
        $updateStmt->execute([
            'name' => $login,
            'year' => $year
        ]);
    }
    session_unset();

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }

    session_destroy();
    session_write_close(); 

    echo json_encode(["success" => true]);
    }

    public static function getUser() {
        if (isset($_SESSION['user'])) {
            echo json_encode($_SESSION['user']);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
        }
    }
    
}
