<?php
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

include_once("../config/db.php");

class editModel {

    //데이터 수정
    public static function update($dbName, $tableName, $modifiedCells) {
        global $conn; 

        mysqli_select_db($conn, $dbName);

        mysqli_begin_transaction($conn);

        try {
            foreach ($modifiedCells as $cell) {
                $primaryKey = mysqli_real_escape_string($conn, $cell['primaryKey']);
                $primaryValue = mysqli_real_escape_string($conn, $cell['primaryValue']);
                $key = mysqli_real_escape_string($conn, $cell['key']);
                $value = mysqli_real_escape_string($conn, $cell['value']);

                $sql = "
                    UPDATE `$tableName`
                    SET `$key` = '$value'
                    WHERE `$primaryKey` = '$primaryValue'
                ";

                if (!mysqli_query($conn, $sql)) {
                    throw new Exception("쿼리 실패: " . mysqli_error($conn));
                }
            }

            mysqli_commit($conn);

            return [
                "status" => "success",
                "message" => "데이터가 저장되었습니다"
            ];
        } catch (Exception $e) {
            mysqli_rollback($conn);

            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }


    //데이터 삽입
    public static function insertRows($dbName, $tableName, $insertRows) {
        global $conn;
    
        mysqli_select_db($conn, $dbName);
    
        mysqli_begin_transaction($conn);
    
        try {
            foreach ($insertRows as $row) {
                $data = isset($row['rowData']) ? $row['rowData'] : $row;
    
                $columns = [];
                $values = [];
    
                foreach ($data as $col => $val) {
                    $escapedCol = mysqli_real_escape_string($conn, $col);
                    $columns[] = "`$escapedCol`";
    
                    if (is_array($val) || is_object($val)) {
                        $values[] = "''";
                    } else {
                        $escapedVal = mysqli_real_escape_string($conn, $val);
                        $values[] = "'$escapedVal'";
                    }
                }
    
                $sql = sprintf(
                    "INSERT INTO `%s` (%s) VALUES (%s)",
                    $tableName,
                    implode(", ", $columns),
                    implode(", ", $values)
                );
    
                if (!mysqli_query($conn, $sql)) {
                    throw new Exception("쿼리 실패: " . mysqli_error($conn));
                }
            }
    
            mysqli_commit($conn);
    
            return [
                "status" => "success",
                "message" => "데이터가 삽입되었습니다."
            ];
    
        } catch (Exception $e) {
            mysqli_rollback($conn);
    
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }
    

    
    //데이터 삭제
    public static function deleteRows($dbName, $tableName, $deleteRows) {
        global $conn;
        
        mysqli_select_db($conn, $dbName);
    
        if (empty($deleteRows)) {
            return [
                'status' => 'success',
                'message' => '삭제할 행이 없습니다.'
            ];
        }
    
        // PK 존재 여부 체크
        $pkName = $deleteRows[0]['primaryKey'] ?? null;
        if (!$pkName) {
            return [
                'status' => 'error',
                'message' => '기본키가 없는 테이블은 삭제할 수 없습니다.'
            ];
        }
    
        foreach ($deleteRows as $row) {
            $pkValue = $row['primaryValue'] ?? null;
            if ($pkValue === null) {
                return [
                    'status' => 'error',
                    'message' => '기본키 값이 비어 있어 삭제할 수 없습니다.'
                ];
            }
    
            $pkValEscaped = mysqli_real_escape_string($conn, $pkValue);
            $sql = "DELETE FROM `$tableName` WHERE `$pkName` = '$pkValEscaped' LIMIT 1";
    
            if (!mysqli_query($conn, $sql)) {
                return [
                    'status' => 'error',
                    'message' => mysqli_error($conn)
                ];
            }
        }
    
        return [
            'status' => 'success',
            'message' => '삭제 완료'
        ];
    }
    

}