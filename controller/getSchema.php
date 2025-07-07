<?php
require_once '../config/db.php';

header('Content-Type: application/json');

$dbName = $_GET['db'] ?? null;
$tableName = $_GET['table'] ?? null;

if (!$dbName || !$tableName) {
    echo json_encode([
        'status' => 'error',
        'message' => 'DB명 또는 테이블명이 없습니다.'
    ]);
    exit;
}

$sql = "
    SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = '$dbName'
      AND TABLE_NAME = '$tableName'
";

$result = mysqli_query($conn, $sql);

if (!$result) {
    echo json_encode([
        'status' => 'error',
        'message' => '쿼리 오류: ' . mysqli_error($conn)
    ]);
    exit;
}

$schema = [];

while ($row = mysqli_fetch_assoc($result)) {
    $schema[$row['COLUMN_NAME']] = [
        'nullable' => $row['IS_NULLABLE'] === 'YES',
        'data_type' => $row['DATA_TYPE'],
        'default' => $row['COLUMN_DEFAULT']
    ];
}

echo json_encode([
    'status' => 'success',
    'schema' => $schema
]);
