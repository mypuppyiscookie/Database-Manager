<?php
require_once '../config/db.php';

header('Content-Type: application/json');

$dbName = $_GET['db'] ?? null;
$tableName = $_GET['table'] ?? null;

if (!$dbName || !$tableName) {
    echo json_encode([
        'status' => 'error',
        'message' => 'DB명 또는 테이블명이 없습니다.',
        'debug' => $_GET
    ]);
    exit;
}

$dbName = mysqli_real_escape_string($conn, $dbName);
$tableName = mysqli_real_escape_string($conn, $tableName);

$sql = "
    SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = '$dbName'
      AND TABLE_NAME = '$tableName'
    ORDER BY ORDINAL_POSITION
";

$result = mysqli_query($conn, $sql);

if (!$result) {
    echo json_encode([
        'status' => 'error',
        'message' => '쿼리 오류: ' . mysqli_error($conn),
        'debug' => [
            'dbName' => $dbName,
            'tableName' => $tableName
        ]
    ]);
    exit;
}

$schema = [];
$columns = [];

while ($row = mysqli_fetch_assoc($result)) {
    $colName = $row['COLUMN_NAME'];

    $schema[$colName] = [
        'nullable' => $row['IS_NULLABLE'] === 'YES',
        'data_type' => $row['DATA_TYPE'],
        'default' => $row['COLUMN_DEFAULT']
    ];

    $columns[] = $colName;
}

// primary key 가져오기
$primaryKey = null;

$pkSql = "
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = '$dbName'
      AND TABLE_NAME = '$tableName'
      AND CONSTRAINT_NAME = 'PRIMARY'
";

$pkResult = mysqli_query($conn, $pkSql);
if ($pkResult && $pkRow = mysqli_fetch_assoc($pkResult)) {
    $primaryKey = $pkRow['COLUMN_NAME'];
}

echo json_encode([
    'status' => 'success',
    'schema' => $schema,
    'columns' => $columns,
    'primaryKey' => $primaryKey,
    'debug' => [
        'dbName' => $dbName,
        'tableName' => $tableName
    ]
]);
