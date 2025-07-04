// 탭 관련 전역 변수
let tabsContainer = null;
let tabsContent = null;
let tabsList = null;

// 탭 생성 함수
function createTab(dbName, tableName) {
    if (!tabsContainer) {
        // 탭 컨테이너가 없으면 생성
        tabsContainer = document.createElement('div');
        tabsContainer.id = 'tabs-container';
        tabsList = document.createElement('div');
        tabsList.className = 'tabs';
        tabsContent = document.createElement('div');
        tabsContent.className = 'tabs-content';
        
        tabsContainer.appendChild(tabsList);
        tabsContainer.appendChild(tabsContent);
        
        const contentArea = document.querySelector('.content-bar');
        if (contentArea) {
            contentArea.insertBefore(tabsContainer, contentArea.firstChild);
        }
    }
    
    const tabId = `tab-${dbName}-${tableName}`.replace(/[^a-zA-Z0-9-]/g, '-');
    
    // 이미 해당 탭이 열려있는지 확인
    const existingTab = document.getElementById(tabId);
    if (existingTab) {
        // 이미 열려있는 탭이면 해당 탭으로 전환
        switchTab(tabId);
        return;
    }
    
    // 새 탭 생성
    const tab = document.createElement('button');
    tab.className = 'tab';
    tab.textContent = `${dbName} - ${tableName}`;
    tab.dataset.tabId = tabId;
    tab.onclick = () => switchTab(tabId);
    
    // 닫기 버튼
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-tab';
    closeBtn.innerHTML = ' &times;';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeTab(tabId);
    };
    tab.appendChild(closeBtn);
    
    // 탭 컨텐츠 영역 생성
    const tabContent = document.createElement('div');
    tabContent.id = tabId;
    tabContent.className = 'tab-content';
    tabContent.dataset.db = dbName;
    tabContent.dataset.table = tableName;
    
    // 로딩 표시
    tabContent.innerHTML = '<div class="loading">로딩 중...</div>';
    
    // 탭과 컨텐츠 추가
    tabsList.appendChild(tab);
    tabsContent.appendChild(tabContent);
    
    // 테이블 데이터 로드
    loadTableData(dbName, tableName, tabContent);
    
    // 새 탭 활성화
    switchTab(tabId);
}

// 탭 전환 함수
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tabId === tabId);
    });
    
    contents.forEach(content => {
        content.style.display = content.id === tabId ? 'block' : 'none';
    });
}

// 탭 닫기 함수
function closeTab(tabId) {
    const tab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    const content = document.getElementById(tabId);
    
    if (tab && content) {
        tab.remove();
        content.remove();
        
        // 마지막 탭이 닫히면 탭 컨테이너 제거
        if (tabsList.children.length === 0) {
            tabsContainer.remove();
            tabsContainer = null;
            tabsList = null;
            tabsContent = null;
        } else {
            // 다른 탭이 있으면 첫 번째 탭으로 전환
            const firstTab = tabsList.querySelector('.tab');
            if (firstTab) {
                switchTab(firstTab.dataset.tabId);
            }
        }
    }
}

// 테이블 데이터 로드 함수
function loadTableData(dbName, tableName, container) {
    fetch(`../controller/getTableData.php?db=${encodeURIComponent(dbName)}&table=${encodeURIComponent(tableName)}`)
        .then(response => response.json())
        .then(renderTable)
        .catch(error => {
            console.error('테이블 데이터 로드 오류:', error);
            container.innerHTML = `<div class="error">데이터를 불러오는 중 오류가 발생했습니다: ${error.message}</div>`;
        });
}

// 페이지가 로드되면 실행
window.onload = function () {
    // DB와 테이블 목록을 가져오는 요청
    fetch('../controller/dbController.php')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('db-container');
            container.innerHTML = '';

            const tableArea = document.createElement('div');
            tableArea.id = 'table-container';
            container.appendChild(tableArea);

            // DB 버튼 생성
            for (const db in data) {
                const dbBtn = document.createElement('button');
                dbBtn.className = 'db-btn';
                dbBtn.textContent = db;
                dbBtn.dataset.db = db;
                container.insertBefore(dbBtn, tableArea);
            }

            let currentVisibleDB = null;

            // DB 버튼 클릭 이벤트
            container.addEventListener('click', function (e) {
                if (e.target.classList.contains('db-btn')) {
                    const selectedDB = e.target.dataset.db;

                    if (currentVisibleDB === selectedDB) {
                        tableArea.innerHTML = '';
                        tableArea.style.display = 'none';
                        currentVisibleDB = null;
                        return;
                    }

                    tableArea.innerHTML = '';
                    const tables = data[selectedDB];

                    tables.forEach(table => {
                        const tableBtn = document.createElement('button');
                        tableBtn.className = 'table-btn';
                        tableBtn.textContent = table;
                        tableBtn.dataset.db = selectedDB;
                        tableBtn.dataset.table = table;

                        tableBtn.addEventListener('click', function (e) {
                            e.stopPropagation();
                            createTab(selectedDB, table);
                            
                            // localStorage 저장
                            localStorage.setItem('lastDbName', selectedDB);
                            localStorage.setItem('lastTableName', table);
                            
                            // URL에 파라미터 추가 (뒤로가기/새로고침 시 유지)
                            const url = new URL(window.location.href);
                            url.searchParams.set('db', selectedDB);
                            url.searchParams.set('table', table);
                            window.history.pushState({}, '', url);
                        });

                        tableArea.appendChild(tableBtn);
                    });

                    tableArea.style.display = 'block';
                    currentVisibleDB = selectedDB;
                }
            });

            // 🔥 로컬스토리지 값으로 복원
            const lastDb = localStorage.getItem('lastDbName');
            const lastTable = localStorage.getItem('lastTableName');

            if (lastDb && lastTable) {
                // DB 버튼 찾아 클릭
                const dbBtn = document.querySelector(`.db-btn[data-db="${lastDb}"]`);
                if (dbBtn) {
                    dbBtn.click();

                    setTimeout(() => {
                        const tableBtn = document.querySelector(`.table-btn[data-db="${lastDb}"][data-table="${lastTable}"]`)
                            || [...document.querySelectorAll(`.table-btn[data-db="${lastDb}"]`)]
                                .find(btn => btn.textContent === lastTable);

                        if (tableBtn) {
                            tableBtn.click();
                            tableBtn.dispatchEvent(new Event('click'));
                        }
                    }, 300);
                }
            }
        })
        .catch(error => {
            document.getElementById('db-container').innerText = '불러오기 실패: ' + error;
        });
};

// 문서 전체에서 테이블 버튼 클릭 시 데이터 표 출력
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('table-btn')) {
        const tableName = e.target.textContent;
        const dbName = e.target.dataset.db;

        fetch(`../controller/getTableData.php?db=${dbName}&table=${tableName}`)
            .then(response => response.json())
            .then(json => {
                const data = json.rows;
                const primaryKey = json.primaryKey;

                const contentArea = document.querySelector('.content-bar');
                contentArea.innerHTML = '';

                if (!data || data.length === 0) {
                    contentArea.textContent = '데이터가 없습니다.';
                    return;
                }

                // ✅ 여기서 div를 생성
                const tableWrapper = document.createElement('div');
                tableWrapper.className = 'data-table';
                // data-table 클래스는 이제 div에 적용

                // ✅ table은 별도 클래스로 관리
                const table = document.createElement('table');
                table.className = 'table-inner';

                // 헤더 생성
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');

                const indexTh = document.createElement('th');
                indexTh.textContent = '#';
                indexTh.style.padding = '1px';
                headerRow.appendChild(indexTh);

                Object.keys(data[0]).forEach(key => {
                    const th = document.createElement('th');
                    if (key === primaryKey) {
                        th.textContent = '🔑 ' + key;
                        th.setAttribute('data-is-pk', 'true');
                        th.setAttribute('data-column-name', key);
                    } else {
                        th.textContent = key;
                    }
                    headerRow.appendChild(th);
                });

                thead.appendChild(headerRow);
                table.appendChild(thead);

                // 본문 생성
                const tbody = document.createElement('tbody');

                data.forEach((row, index) => {
                    const tr = document.createElement('tr');

                    tr.dataset.pkValue = row[primaryKey];
                    tr.dataset.pkName = primaryKey;

                    const indexTd = document.createElement('td');
                    indexTd.textContent = index + 1;
                    indexTd.className = 'row-index';
                    tr.appendChild(indexTd);

                    for (const key in row) {
                        const td = document.createElement('td');
                        const btn = document.createElement('button');
                        btn.className = 'cell-btn';
                        btn.textContent = row[key];
                        btn.dataset.db = dbName;
                        btn.dataset.key = key;
                        btn.dataset.value = row[key];
                        btn.dataset.id = row[primaryKey];
                        td.appendChild(btn);
                        tr.appendChild(td);
                    }

                    tbody.appendChild(tr);
                });

                // 빈 행 채우기
                const MIN_ROWS = 32;
                const currentRows = data.length;
                for (let i = currentRows; i < MIN_ROWS; i++) {
                    const tr = document.createElement('tr');

                    const indexTd = document.createElement('td');
                    indexTd.textContent = i + 1;
                    indexTd.className = 'row-index';
                    tr.appendChild(indexTd);

                    if (data.length > 0) {
                        Object.keys(data[0]).forEach(() => {
                            const td = document.createElement('td');
                            td.innerHTML = '&nbsp;';
                            tr.appendChild(td);
                        });
                    }
                    tbody.appendChild(tr);
                }

                table.appendChild(tbody);
                // ✅ div에 table을 append
                tableWrapper.appendChild(table);
                contentArea.appendChild(tableWrapper);

                // edit-bar 초기화
                const oldBar = document.querySelector('.edit-bar');
                if (oldBar) oldBar.remove();

                // edit-bar 생성
                const editBar = document.createElement('div');
                editBar.className = 'edit-bar';

                const btnRefresh = document.createElement('button');
                btnRefresh.type = 'button';
                btnRefresh.id = 'refresh';
                btnRefresh.className = 'refresh-btn';
                btnRefresh.textContent = '새로고침';

                const btnSave = document.createElement('button');
                btnSave.type = 'button';
                btnSave.id = 'save';
                btnSave.className = 'green-btn';
                btnSave.textContent = '저장';

                const btnCancel = document.createElement('button');
                btnCancel.type = 'button';
                btnCancel.id = 'cancel';
                btnCancel.className = 'red-btn';
                btnCancel.textContent = '취소';

                const btnAdd = document.createElement('button');
                btnAdd.type = 'button';
                btnAdd.id = 'add';
                btnAdd.className = 'green-btn';
                btnAdd.textContent = '로우 추가';

                const btnDelete = document.createElement('button');
                btnDelete.type = 'button';
                btnDelete.id = 'delete';
                btnDelete.className = 'red-btn';
                btnDelete.textContent = '로우 삭제';

                const separator1 = document.createElement('span');
                separator1.textContent = '|';
                separator1.className = 'separator';

                const separator2 = document.createElement('span');
                separator2.textContent = '|';
                separator2.className = 'separator';

                editBar.appendChild(btnRefresh);
                editBar.appendChild(separator1);
                editBar.appendChild(btnSave);
                editBar.appendChild(btnCancel);
                editBar.appendChild(separator2);
                editBar.appendChild(btnAdd);
                editBar.appendChild(btnDelete);

                contentArea.appendChild(editBar);

                // edit-bar 생성 완료 후 이벤트 발송
                const event = new Event('editBarReady');
                document.dispatchEvent(event);
            })
            .catch(err => {
                console.error('데이터 로딩 오류:', err);
            });
    }
});
