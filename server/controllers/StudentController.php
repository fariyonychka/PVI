<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../models/Student.php';
require_once __DIR__ . '/../views/jsonResponse.php';

class StudentController {
    public static function handle($method) {
        switch ($method) {
            case 'GET':
                self::getStudents();
                break;
            default:
                http_response_code(405);
                echo json_encode(['error' => 'Method Not Allowed']);
                break;
        }
    }

    private static function getStudents() {
        $students = Student::getAll();
        echo json_encode($students);
    }
}
