<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../models/Student.php';
require_once __DIR__ . '/../views/jsonResponse.php';

class StudentController {
    public static function handle($method) {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $_GET['id'] ?? null;

        switch ($method) {
            case 'GET':
                self::getStudents();
                break;
            case 'POST':
                self::addStudent($data);
                break;
            case 'PUT':
                self::updateStudent($id, $data);
                break;
                case 'DELETE':
                    $id = $_GET['id'] ?? ($data['id'] ?? null); // підтримка GET або тіла
                    self::deleteStudent($id);
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

    private static function addStudent($data) {
        $result = Student::add($data);
        echo json_encode($result);
    }

    private static function updateStudent($id, $data) {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Не вказано ID']);
            return;
        }

        $result = Student::update($id, $data);
        echo json_encode($result);
    }

    private static function deleteStudent($id) {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Не вказано ID']);
            return;
        }

        $result = Student::delete($id);
        echo json_encode($result);
    }
}
