<?php
session_start();
require_once("../model/userModel.php");

$error = ""; //에러 메시지 초기화

// POST 요청일 때만 처리 (로그인 폼에서 submit한 경우)
if ($_SERVER["REQUEST_METHOD"] === "POST") {

    //로그인 폼에서 입력한 아이디, 비밀번호를 변수에 저장
    $user_id = trim($_POST["user_id"]); //trim()으로 앞뒤 공백 제거
    $user_pwd = trim($_POST["user_pwd"]);

    //입력한 user_id로 DB에서 사용자 정보 가져오기 (userModel 클래스의 getUserById 메소드 사용)
    $user = userModel::getUserById($user_id);

    // 사용자 정보가 존재하고, 비밀번호가 해시 비교에 성공하면
    if ($user && password_verify($user_pwd, $user["user_pwd"])) {

        //세션에 사용자 아이디와 이름 저장
        $_SESSION["user_id"] = $user_id;
        $_SESSION["user_name"] = $user["user_name"];

        //메인 페이지로 이동
        header("Location: ../view/main.php");
        exit(); //이동 후 코드 실행 방지
    } else {
        $error = "아이디 또는 비밀번호가 일치하지 않습니다."; //로그인 실패 시 에러 메시지 설정
    }
}
//페이지 처음 들어왔거나 로그인에 실패한 경우에 로그인 화면 보여주기
include("../view/auth/login.php");
