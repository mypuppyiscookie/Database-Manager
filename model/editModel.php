<?php
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

        mysqli_begin_transaction($conn);

        try {
            foreach ($deleteRows as $row) {
                $primaryKey = mysqli_real_escape_string($conn, $row['primaryKey']);
                $primaryValue = mysqli_real_escape_string($conn, $row['primaryValue']);

                $sql = "
                    DELETE FROM `$tableName`
                    WHERE `$primaryKey` = '$primaryValue'
                ";

                if (!mysqli_query($conn, $sql)) {
                    throw new Exception("쿼리 실패: " . mysqli_error($conn));
                }
            }

            mysqli_commit($conn);

            return [
                "status" => "success",
                "message" => "데이터가 삭제되었습니다."
            ];

        } catch (Exception $e) {
            mysqli_rollback($conn);

            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }

}