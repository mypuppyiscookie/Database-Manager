<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="../../css/login.css">
    <title>로그인</title>
</head>
<body>
    <div class="login-container">
        <h2>로그인</h2>
        <!-- 에러 메시지 보여주기 -->
        <?php if (!empty($error)) echo "<p style='color:red;'>$error</p>"; ?>
        <form method="post" action="../../controller/loginController.php">
            <input type="text" name="user_id" placeholder="Id" required />
            <input type="password" name="user_pwd" placeholder="Password" required />
            <button type="submit" class="submit-btn">로그인</button>
        </form>
        <div class="link">
            <a href="findPwd.php">비밀번호 찾기</a>
            <a href="register.php">회원가입</a>
        </div>
    </div>
</body>
</html>
