<?php
header('Content-Type: application/json');

// 데이터베이스 설정 로드
require_once '../config/db.php';

global $conn;

// 요청 데이터 가져오기
$query = $_POST['query'] ?? '';

if (empty($query)) {
    echo json_encode(['error' => '쿼리를 입력해주세요.']);
    exit;
}

try {
    // 기존 MySQLi 연결 사용

    // 쿼리 실행
    $result = mysqli_query($conn, $query);
    
    if ($result === false) {
        throw new Exception(mysqli_error($conn));
    }
    
    // SELECT 문인 경우 결과 반환
    if (stripos(trim($query), 'select') === 0) {
        $rows = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $rows[] = $row;
        }
        echo json_encode($rows);
    } 
    // INSERT, UPDATE, DELETE 문인 경우 영향 받은 행 수 반환
    else {
        $affectedRows = mysqli_affected_rows($conn);
        echo json_encode(['affectedRows' => $affectedRows]);
    }
} catch (Exception $e) {
    // 오류 발생 시 오류 메시지 반환
    echo json_encode(['error' => $e->getMessage()]);
}
?>
