<?php
session_start();

if (isset($_SESSION['user_id'])) {
    header("Location: /view/main.php");
    exit();
} else {
    header("Location: /view/auth/login.php");
    exit();
}
?>