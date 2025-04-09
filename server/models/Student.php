<?php

class Student {
    private static $file = __DIR__ . '/../data/students.json';

    public static function all() {
        return json_decode(file_get_contents(self::$file), true);
    }

    public static function saveAll($students) {
        file_put_contents(self::$file, json_encode($students, JSON_PRETTY_PRINT));
    }

    public static function add($data) {
        $students = self::all();
        foreach ($students as $student) {
            if (
                $student['firstName'] === $data['firstName'] &&
                $student['lastName'] === $data['lastName']
            ) return ["error" => "Student already exists"];
        }
        $data['id'] = time(); // унікальний ID
        $students[] = $data;
        self::saveAll($students);
        return ["success" => true, "student" => $data];
    }

    public static function update($data) {
        $students = self::all();
        foreach ($students as &$student) {
            if ($student['id'] == $data['id']) {
                $student = array_merge($student, $data);
                self::saveAll($students);
                return ["success" => true, "student" => $student];
            }
        }
        return ["error" => "Student not found"];
    }

    public static function delete($id) {
        $students = self::all();
        $new = array_filter($students, fn($s) => $s['id'] != $id);
        if (count($new) === count($students)) return ["error" => "Student not found"];
        self::saveAll(array_values($new));
        return ["success" => true];
    }
}