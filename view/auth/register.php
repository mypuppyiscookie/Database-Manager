<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>회원가입</title>
    <link rel="stylesheet" href="../../css/login.css"></link>
    <script src="../../js/auth.js"></script>
</head>
<body>
    <div class= "login-container">
        <h2>회원가입</h2>
        <!-- 에러 메시지 보여주기 -->
        <?php if (!empty($error)) echo "<p style='color:red;'>$error</p>"; ?>

        <form method="post" action="../../controller/registerController.php">
            <input type="text" name="user_name" placeholder="이름" required>

            <span id="id_check_result"></span>
            <div class="id_set">
                <input type="text" id="user_id" name="user_id" placeholder="아이디" required>
                <button type="button" id="check_btn" class="check-btn">중복 확인</button>
            </div>
            

            <input type="password" name="user_pwd" placeholder="비밀번호" required>
            <input type="password" name="user_pwd_confirm" placeholder="비밀번호 확인" required>
            <button type="submit" class="submit-btn">가입하기</button>
        </form>
    </div>
</body>
</html>
