<?php
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

require_once("../model/dbModel.php");

// JSON 응답 헤더
header('Content-Type: application/json');

// 데이터베이스 및 테이블 목록 가져오기
$dbList = dbModel::getDatabases();
$response = [];

foreach ($dbList as $dbName) {
    $response[$dbName] = dbModel::getTables($dbName);
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
exit;

include("../view/main.php");