<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once("../model/editModel.php");

header('Content-Type: application/json');

$dbName = $_GET['db'] ?? null;
$tableName = $_GET['table'] ?? null;
$action = $_GET['action'] ?? null;

if (!$dbName || !$tableName || !$action) {
    echo json_encode([
        "status" => "error",
        "message" => "필수 파라미터 누락"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    switch ($action) {
        case 'save':
            handleSave($dbName, $tableName);
            break;

        case 'fetch':
            $data = dbModel::getTableData($dbName, $tableName);
            echo json_encode([
                "status" => "success",
                "data" => $data
            ], JSON_UNESCAPED_UNICODE);
            break;

        default:
            echo json_encode([
                "status" => "error",
                "message" => "지원하지 않는 액션입니다."
            ], JSON_UNESCAPED_UNICODE);
            break;
    }

    exit;
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}


// 저장 처리
function handleSave($dbName, $tableName) {
    $json = file_get_contents("php://input");
    $payload = json_decode($json, true);

    $logDir = '/tmp/php_logs';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    $logFile = $logDir . '/db_edit.log';

    @file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] [Payload]\n" . print_r($payload, true) . "\n\n", FILE_APPEND);

    if (empty($json)) {
        echo json_encode([
            "status" => "error",
            "message" => "수신된 JSON 데이터가 없습니다."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode([
            "status" => "error",
            "message" => "잘못된 JSON 형식: " . json_last_error_msg()
        ], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    if (!$payload || !is_array($payload)) {
        echo json_encode([
            "status" => "error",
            "message" => "파싱된 payload가 배열이 아닙니다."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    if (!$payload) {
        echo json_encode([
            "status" => "error",
            "message" => "수정할 데이터가 없습니다."
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    $insertRows = $payload['insertRows'] ?? [];
    $updateCells = $payload['updateCells'] ?? [];
    $deleteRows = $payload['deleteRows'] ?? [];

    $results = [];
    $hasError = false;

    if (!empty($insertRows)) {
        $res = editModel::insertRows($dbName, $tableName, $insertRows);
        $results['insert'] = $res;
        if (isset($res['status']) && $res['status'] === 'error') {
            $hasError = true;
        }
    }

    if (!empty($updateCells)) {
        $res = editModel::update($dbName, $tableName, $updateCells);
        $results['update'] = $res;
        if (isset($res['status']) && $res['status'] === 'error') {
            $hasError = true;
        }
    }

    if (!empty($deleteRows)) {
        $res = editModel::deleteRows($dbName, $tableName, $deleteRows);
        $results['delete'] = $res;
        if (isset($res['status']) && $res['status'] === 'error') {
            $hasError = true;
        }
    }

    @file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] [Result]\n" . print_r($results, true) . "\n\n", FILE_APPEND);

    if ($hasError) {
        $errorMessages = [];

        foreach ($results as $key => $operation) {
            if (isset($operation['status']) && $operation['status'] === 'error') {
                $errorMessages[] = $operation['message'];
            }
        }

        echo json_encode([
            "status" => "error",
            "message" => implode("\n\n", $errorMessages),
            "details" => $results
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            "status" => "success",
            "message" => "저장 완료",
            "details" => $results
        ], JSON_UNESCAPED_UNICODE);
    }
}