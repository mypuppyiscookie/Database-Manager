<?php
require_once("../config/db.php");

//사용자 관련 기능을 정의하는 클래스
class userModel {

    //사용자 id로 사용자의 정보를 가져오는 함수
    public static function getUserById($user_id) {
        global $conn; //DB 연결

        //SQL 쿼리 미리 준비 (user_id가 ?인 레코드를 가져오는 SELECT문)
        $stmt = mysqli_prepare($conn, "SELECT user_id, user_pwd, user_name FROM user WHERE user_id = ?");

        //준비된 쿼리에 실제 값($user_id)을 바인딩 (s = string)
        mysqli_stmt_bind_param($stmt, "s", $user_id);

        //바인딩이 끝난 쿼리를 실행
        mysqli_stmt_execute($stmt);
        
        // 쿼리 결과에서 각 필드 값을 PHP 변수에 연결 (순서대로)
        mysqli_stmt_bind_result($stmt, $user_id, $user_pwd, $user_name);
        
        //결과를 한 줄 fetch(가져오기) 했을 때
        if (mysqli_stmt_fetch($stmt)) {
            return [ //user_pwd, user_name 값을 배열로 반환
                "user_pwd" => $user_pwd,
                "user_name" => $user_name
            ];
        } else { //사용자를 찾지 못하면 null 반환
            return null;
        }
    }

    //사용자 정보를 DB에 삽입하는 함수
    public static function insertUser($user_id, $user_pwd, $user_name) {
        global $conn; //DB 연결

        //SQL 쿼리 미리 준비 (아이디, 비밀번호, 사용자 이름을 삽입하는 INSERT문)
        $stmt = mysqli_prepare($conn, "INSERT INTO user (user_id, user_pwd, user_name) VALUES (?, ?, ?)");

        //쿼리 준비가 실패한 경우 false를 반환
        if (!$stmt) return false;

        //각 물음표에 실제 값을 바인딩 (sss = 모두 string이라는 의미)
        mysqli_stmt_bind_param($stmt, "sss", $user_id, $user_pwd, $user_name);
        
        //쿼리 실행하고 성공 여부를 $result에 저장
        $result = mysqli_stmt_execute($stmt);

        //사용이 끝난 statement 자원 해제
        mysqli_stmt_close($stmt);

        //실행 결과 반환
        return $result;
    }
}
?>