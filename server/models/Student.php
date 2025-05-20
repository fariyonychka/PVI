<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../helpers/db.php';

class Student {
    public static function getAll() {
        global $pdo;

        $stmt = $pdo->query("SELECT * FROM students");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function add($data) {
        global $pdo;
        $errors = self::validate($data);

        if (empty($errors) && self::isDuplicate($data)) {
            $errors['duplicate'] = 'Такий студент вже існує';
        }

        if (!empty($errors)) return ['success' => false, 'errors' => $errors];

        $stmt = $pdo->prepare("INSERT INTO students (student_group, first_name, last_name, gender, birthday, status) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['student_group'],
            $data['first_name'],
            $data['last_name'],
            $data['gender'],
            $data['birthday'],
            $data['status']
        ]);

        return ['success' => true];
    }

    public static function update($id, $data) {
        global $pdo;
        $errors = self::validate($data);

        if (empty($errors) && self::isDuplicate($data, $id)) {
            $errors['duplicate'] = 'Такий студент вже існує';
        }

        if (!empty($errors)) return ['success' => false, 'errors' => $errors];

        $stmt = $pdo->prepare("UPDATE students SET student_group=?, first_name=?, last_name=?, gender=?, birthday=?, status=? WHERE id=?");
        $stmt->execute([
            $data['student_group'],
            $data['first_name'],
            $data['last_name'],
            $data['gender'],
            $data['birthday'],
            $data['status'],
            $id
        ]);

        return ['success' => true];
    }

    public static function delete($id) {
        global $pdo;
        $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
        if ($stmt->execute([$id])) {
            return ['success' => true];
        } else {
            return ['success' => false, 'error' => 'Не вдалося видалити студента'];
        }
    }

    private static function isDuplicate($data, $ignoreId = null) {
        global $pdo;
        $query = "SELECT COUNT(*) FROM students WHERE student_group=? AND first_name=? AND last_name=? AND birthday=?";
        $params = [
            $data['student_group'],
            $data['first_name'],
            $data['last_name'],
            $data['birthday']
        ];
        if ($ignoreId) {
            $query .= " AND id != ?";
            $params[] = $ignoreId;
        }

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchColumn() > 0;
    }

    private static function validate($data) {
        $errors = [];

    if (empty($data['student_group']) || !preg_match('/^[A-Z]{2}-\d{2}$/', $data['student_group'])) {
        $errors['student_group'] = 'Група має бути у форматі XX-00';
    }

    if (empty($data['first_name']) || !preg_match("/^[A-Z][a-z]+([-'’][A-Z]?[a-z]+)*$/", $data['first_name'])) {
        $errors['first_name'] = 'Імʼя має починатись з великої літери та містити лише латинські букви';
    }

    if (empty($data['last_name']) || !preg_match("/^[A-Z][a-z]+([-'’][A-Z]?[a-z]+)*$/", $data['last_name'])) {
        $errors['last_name'] = 'Прізвище має починатись з великої літери та містити лише латинські букви';
    }

    if (empty($data['gender']) || !in_array($data['gender'], ['M', 'F'])) {
        $errors['gender'] = 'Стать має бути M або F';
    }

    if (empty($data['birthday']) || !self::validateDate($data['birthday'])) {
        $errors['birthday'] = 'Невірна дата народження';
    } else {
        $birthday = new DateTime($data['birthday']);
        $today = new DateTime();
        $age = $today->diff($birthday)->y;

        if ($age < 16 || $age > 100) {
            $errors['birthday'] = 'Вік має бути від 16 до 100 років';
        }
    }

    if (empty($data['status'])) {
        $data['status'] = 'inactive';
    }

    return $errors;
    }

    private static function validateDate($date, $format = 'Y-m-d') {
        $d = DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }
}