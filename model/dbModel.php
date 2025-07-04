<?php
require_once("../config/db.php");

class dbModel {
    // 데이터베이스 목록 가져오기
    public static function getDatabases() {
        global $conn;
        $result = mysqli_query($conn, "SHOW DATABASES");
        $databases = [];

        while ($row = mysqli_fetch_assoc($result)) {
            $databases[] = $row['Database'];
        }

        return $databases;
    }

    // 특정 데이터베이스의 테이블 목록 가져오기
    public static function getTables($dbName) {
        global $conn;

        // 선택할 수 없는 시스템 DB는 제외
        if (in_array($dbName, ['information_schema', 'performance_schema', 'mysql', 'sys'])) {
            return [];
        }

        mysqli_select_db($conn, $dbName);
        $result = mysqli_query($conn, "SHOW TABLES");
        $tables = [];

        while ($row = mysqli_fetch_row($result)) {
            $tables[] = $row[0];
        }

        return $tables;
    }

    //특정 테이블의 데이터 목록 가져오기
    public static function getTableData($dbName, $tableName) {
        global $conn;

        mysqli_select_db($conn, $dbName);

        $sql = "SELECT * FROM `$tableName`";
        $result = mysqli_query($conn, $sql);

        $rows = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $rows[] = $row;
        }

        return $rows;
    }

    //기본 키 추출
    public static function getPrimaryKey($dbName, $tableName) {
        global $conn;

        mysqli_select_db($conn, $dbName);

        $sql = "
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '$dbName'
            AND TABLE_NAME = '$tableName'
            AND COLUMN_KEY = 'PRI'
            LIMIT 1
        ";

        $result = mysqli_query($conn, $sql);

        if (!$result) {
            throw new Exception("쿼리 실패: " . mysqli_error($conn));
        }

        $row = mysqli_fetch_assoc($result);

        return $row ? $row['COLUMN_NAME'] : null;
    }


}