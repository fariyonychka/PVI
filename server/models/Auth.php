<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../helpers/db.php';

class Auth {
    public static function login($login, $password) {
        global $pdo;

        $stmt = $pdo->prepare("SELECT * FROM users WHERE login = :login");
        $stmt->execute(['login' => $login]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && $user['pass'] === $password) {
            $_SESSION['user'] = [
                'id' => $user['id'],

                'login' => $user['login'],
                'birth_year' => $user['pass']
            ];
             $updateStmt = $pdo->prepare("
            UPDATE students 
            SET status = 'active' 
            WHERE first_name = :name 
              AND YEAR(birthday) = :year
        ");
        $updateStmt->execute([
            'name' => $user['login'],
            'year' => $user['pass']
        ]);

            return ["success" => true, "user" => $_SESSION['user']];
        }
        

        return ["error" => "Invalid login or password"];
    }
}
