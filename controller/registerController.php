<?php
session_start();
require_once("../model/userModel.php");

$error = ""; //에러 메시지용 변수 초기화

//아이디 중복 확인
if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET["user_id"])) {
    $user_id = $_GET["user_id"];

    if (userModel::getUserById($user_id)) {
        echo "EXISTS"; // 이미 있음
    } else {
        echo "OK"; // 사용 가능
    }
    exit(); // Ajax 응답 후 종료
}

//폼에서 제출한 요청이 POST 방식인지 확인
if ($_SERVER["REQUEST_METHOD"] === "POST") {

    //입력 값 앞뒤 공백 제거해서 변수에 저장
    $user_id = trim($_POST["user_id"]);
    $user_pwd = trim($_POST["user_pwd"]);
    $user_pwd_confirm = trim($_POST["user_pwd_confirm"]);
    $user_name = trim($_POST["user_name"]);

    //세 입력값 모두 비어있지 않은지 확인
    if ($user_id && $user_pwd && $user_name) {

        if ($user_pwd !== $user_pwd_confirm) { //비밀번호 확인
            $error ="비밀번호가 일치하지 않습니다";
        } else {
            //비밀번호 해시 처리
            $hashed_pwd = password_hash($user_pwd, PASSWORD_DEFAULT);
            
            //사용자 정보 DB에 삽입
            if (userModel::insertUser($user_id, $hashed_pwd, $user_name)) {

            //성공 시 회원가입 성공 페이지로 이동
            header("Location: ../view/auth/success.php");
            exit(); //이동 후 코드 실행 방지를 위해 exit() 호출

            } else {
                //DB 삽입 실패 시 에러 메시지 설정
                $error = "회원가입에 실패했습니다";
            }
        }
    } else {
        //하나라도 비어있는 값이 있을 시 에러 메시지 설정
        $error = "모든 필드를 입력해주세요";
    }
}

//폼을 처음 열었거나 실패했을 경우 회원가입 화면 보여줌
include("../view/auth/register.php");
?>
