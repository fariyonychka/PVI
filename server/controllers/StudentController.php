<?php
require_once __DIR__ . '/../models/Student.php';
require_once __DIR__ . '/../views/jsonResponse.php';

class StudentController {
    public static function handle($method) {
        if (!isset($_SESSION['user'])) {
            echo jsonResponse(['error' => 'Unauthorized'], 401);
            return;
        }

        switch ($method) {
            case 'GET':
                echo jsonResponse(Student::all());
                break;
            case 'POST':
                $data = json_decode(file_get_contents("php://input"), true);
                $result = Student::add($data);
                echo jsonResponse($result);
                break;
            case 'PUT':
                $data = json_decode(file_get_contents("php://input"), true);
                $result = Student::update($data);
                echo jsonResponse($result);
                break;
            case 'DELETE':
                $id = $_GET['id'];
                $result = Student::delete($id);
                echo jsonResponse($result);
                break;
            default:
                echo jsonResponse(['error' => 'Method Not Allowed'], 405);
        }
    }
}
