<?php
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

require_once("../model/dbModel.php");

header('Content-Type: application/json');

$dbName = $_GET['db'] ?? '';
$tableName = $_GET['table'] ?? '';

if (!$dbName || !$tableName) {
    echo json_encode([]);
    exit;
}

$tableData = dbModel::getTableData($dbName, $tableName);
$primaryKey = dbModel::getPrimaryKey($dbName, $tableName);

echo json_encode([
    'rows' => $tableData,
    'primaryKey' => $primaryKey
], JSON_UNESCAPED_UNICODE);

exit;
