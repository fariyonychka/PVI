<?php
class Auth {
    public static function login($login, $password) {
        $students = json_decode(file_get_contents(__DIR__ . '/../data/students.json'), true);

        foreach ($students as $student) {
            if ($student['login'] === $login && $student['password'] === $password) {
                $_SESSION['user'] = $student;
                return ["success" => true, "user" => $student];
            }
        }

        return ["error" => "Invalid login or password"];
    }
}
