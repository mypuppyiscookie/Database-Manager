<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Database Manager</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../css/main.css" />
    <script src="../js/loadDb.js"></script>
    <script src="../js/edit.js"></script>
    <script src="../js/sql.js"></script>
</head>
<body>
    <div class="main-container">
        <header>
            <a class="logo" href="main.php">Database Manager</a>
            <div class="nav-bar">
                <a href="#" id="sql-btn">SQL</a>
                <a href="#" id="import-btn">Import</a>
                <a href="#" id="export-btn">Export</a>
                <a href="#" id="my-btn">My</a>
            </div>
        </header>
        <div id="tabs" class="tabs"></div>
        <div class="main-contents">
            <div class="side-bar">
                <div id="db-container">
                    <div id="table-container"></div>
                </div>
            </div>
            <div id="contentBar" class="content-bar"></div>
        </div>
    </div>
</body>
</html>