function loadTableDataWithSchema(dbName, tableName, container) {
    loadTableSchema(dbName, tableName, () => {
        loadTableData(dbName, tableName, container);
    });
}

// 탭 관련 전역 변수
let tabsContainer = null;
let tabsContent = null;
let tabsList = null;

// 현재 테이블 스키마 저장용 전역 변수
window.currentTableSchema = null;

// 스키마와 데이터를 함께 로드하는 함수
function loadTableSchema(dbName, tableName, callback) {
    fetch(`../controller/getSchema.php?db=${encodeURIComponent(dbName)}&table=${encodeURIComponent(tableName)}`)
        .then(res => res.json())
        .then(json => {
            if (json.status === 'success') {
                window.currentTableSchema = json.columns;
                window.currentPrimaryKey = json.primaryKey || null;
                if (callback) callback();
            } else {
                alert(json.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert('스키마를 불러오지 못했습니다.');
        });
}

// 탭 생성 함수
function createTab(dbName, tableName) {
    if (!tabsContainer) {
        // 탭 영역 초기 세팅
        tabsContainer = document.createElement('div');
        tabsContainer.id = 'tabs-container';
        tabsContainer.className = 'tabs-container';

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

    const existingTab = document.getElementById(tabId);
    if (existingTab) {
        console.log("[createTab] 기존 탭 복원 → 재로딩:", dbName, tableName, tabId);
        switchTab(tabId);
        
        // ⭐ 반드시 다시 로딩 시도
        loadTableDataWithSchema(dbName, tableName, existingTab);
        return;
    }

    // 새 탭 버튼 생성
    const tab = document.createElement('button');
    tab.className = 'tab';
    tab.textContent = `${tableName}`;
    tab.dataset.tabId = tabId;
    tab.onclick = () => {
        switchTab(tabId);
        saveTabsToLocalStorage();

        // ⭐ 탭 클릭 시에도 dataset 이용해 재로딩
        const content = document.getElementById(tabId);
        if (content) {
            const db = content.dataset.db;
            const table = content.dataset.table;
            if (db && table) {
                loadTableDataWithSchema(db, table, content);
            }
        }
    };

    // 닫기 버튼 생성
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-tab';
    closeBtn.innerHTML = ' &times;';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeTab(tabId);
        saveTabsToLocalStorage();
    };
    tab.appendChild(closeBtn);

    // 탭 컨텐츠 영역 생성
    const tabContent = document.createElement('div');
    tabContent.id = tabId;
    tabContent.className = 'tab-content';
    tabContent.dataset.db = dbName;
    tabContent.dataset.table = tableName;
    tabContent.innerHTML = '<div class="loading">로딩 중...</div>';

    tabsList.appendChild(tab);
    tabsContent.appendChild(tabContent);

    loadTableSchema(dbName, tableName, () => {
        loadTableData(dbName, tableName, tabContent);
        switchTab(tabId);
    });
}


// 탭 전환 함수
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    // 활성화된 탭에 data-tab-active 클래스 추가 (오류 방지)
    const activeTab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (activeTab) {
        // 기존에 활성화된 탭에서 클래스 제거
        document.querySelectorAll('.tab.data-tab-active').forEach(tab => {
            tab.classList.remove('data-tab-active');
        });
        // 새로 활성화된 탭에 클래스 추가
        activeTab.classList.add('data-tab-active');
    }

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

        if (tabsList.children.length === 0) {
            tabsContainer.remove();
            tabsContainer = null;
            tabsList = null;
            tabsContent = null;
            localStorage.removeItem('openedTabs');
        } else {
            const firstTab = tabsList.querySelector('.tab');
            if (firstTab) {
                switchTab(firstTab.dataset.tabId);
            }
        }
    }
}

// 테이블 데이터를 불러오는 함수
function loadTableData(dbName, tableName, container) {
    fetch(`../controller/getTableData.php?db=${encodeURIComponent(dbName)}&table=${encodeURIComponent(tableName)}`)
        .then(response => response.json())
        .then(json => {
            const data = json.rows || [];
            const primaryKey = json.primaryKey || window.currentPrimaryKey || null;

            // primaryKey도 window에 저장
            window.currentPrimaryKey = primaryKey;

            // currentTableSchema도 저장
            if (json.columns) {
                window.currentTableSchema = json.columns;
            }

            container.innerHTML = '';

            // 테이블 Wrapper 생성
            const tableWrapper = document.createElement('div');
            tableWrapper.className = 'data-table';

            const table = document.createElement('table');
            table.className = 'table-inner';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            const indexTh = document.createElement('th');
            indexTh.textContent = '#';
            headerRow.appendChild(indexTh);

            // 컬럼 키 목록 가져오기
            let keys = [];

            if (data.length > 0) {
                keys = Object.keys(data[0]);
            } else if (Array.isArray(window.currentTableSchema)) {
                keys = window.currentTableSchema;
            } else if (window.currentTableSchema && typeof window.currentTableSchema === 'object') {
                keys = Object.keys(window.currentTableSchema);
            }

            keys.forEach(key => {
                const th = document.createElement('th');
                if (primaryKey && key === primaryKey) {
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

            const tbody = document.createElement('tbody');

            // 데이터 rows 생성
            data.forEach((row, index) => {
                const tr = document.createElement('tr');
                tr.dataset.pkValue = row[primaryKey] ?? '';
                tr.dataset.pkName = primaryKey ?? '';

                const indexTd = document.createElement('td');
                indexTd.textContent = index + 1;
                indexTd.className = 'row-index';
                tr.appendChild(indexTd);

                keys.forEach(key => {
                    const td = document.createElement('td');
                    const btn = document.createElement('button');
                    btn.className = 'cell-btn';
                    btn.textContent = row[key] ?? '';
                    btn.dataset.db = dbName;
                    btn.dataset.key = key;
                    btn.dataset.value = row[key] ?? '';
                    btn.dataset.id = row[primaryKey] ?? '';
                    td.appendChild(btn);
                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
            });

            // 최소 33행 유지
            const MIN_ROWS = 34;
            const dataRows = data.length;
            const emptyRows = Math.max(0, MIN_ROWS - dataRows);

            for (let i = 0; i < emptyRows; i++) {
                const tr = document.createElement('tr');
                tr.dataset.pkValue = '';
                tr.dataset.pkName = primaryKey || '';

                const indexTd = document.createElement('td');
                indexTd.className = 'row-index';
                indexTd.textContent = dataRows + i + 1;
                tr.appendChild(indexTd);

                keys.forEach((key) => {
                    const td = document.createElement('td');
                    const btn = document.createElement('button');
                    btn.className = 'cell-btn';
                    btn.textContent = '\u00A0';
                    btn.disabled = true;
                    btn.dataset.db = dbName;
                    btn.dataset.key = key;
                    btn.dataset.value = '';
                    btn.dataset.id = '';
                    td.appendChild(btn);
                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
            }

            table.appendChild(tbody);
            tableWrapper.appendChild(table);
            container.appendChild(tableWrapper);

            const oldBar = container.querySelector('.edit-bar');
            if (oldBar) oldBar.remove();

            // edit-bar 생성
            const editBar = document.createElement('div');
            editBar.className = 'edit-bar';

            const btnRefresh = document.createElement('button');
            btnRefresh.type = 'button';
            btnRefresh.id = 'refresh';
            btnRefresh.textContent = '새로고침';
            btnRefresh.onclick = () => {
                const activeTab = tabsList.querySelector('.tab.active');
                if (activeTab) {
                    const tabId = activeTab.dataset.tabId;
                    const tabContent = document.getElementById(tabId);
                    const db = tabContent?.dataset.db;
                    const table = tabContent?.dataset.table;
                    if (db && table) {
                        loadTableDataWithSchema(db, table, tabContent);
                    }
                }
            };

            const btnSave = document.createElement('button');
            btnSave.type = 'button';
            btnSave.id = 'save';
            btnSave.textContent = '저장';
            btnSave.disabled = true;

            const btnCancel = document.createElement('button');
            btnCancel.type = 'button';
            btnCancel.id = 'cancel';
            btnCancel.textContent = '취소';
            btnCancel.disabled = true;
            btnCancel.onclick = () => {
                const activeTab = tabsList.querySelector('.tab.active');
                if (activeTab) {
                    const tabId = activeTab.dataset.tabId;
                    const tabContent = document.getElementById(tabId);
                    const db = tabContent?.dataset.db;
                    const table = tabContent?.dataset.table;
                    if (db && table) {
                        loadTableDataWithSchema(db, table, tabContent);
                    }
                }
            };

            const btnAdd = document.createElement('button');
            btnAdd.type = 'button';
            btnAdd.id = 'add';
            btnAdd.textContent = '로우 추가';
            btnAdd.onclick = () => {
                handleAddRow();
            };

            const btnDelete = document.createElement('button');
            btnDelete.type = 'button';
            btnDelete.id = 'delete';
            btnDelete.textContent = '로우 삭제';

            editBar.appendChild(btnRefresh);
            editBar.appendChild(btnSave);
            editBar.appendChild(btnCancel);
            editBar.appendChild(btnAdd);
            editBar.appendChild(btnDelete);

            container.appendChild(editBar);

            const event = new Event('editBarReady');
            document.dispatchEvent(event);
        })
        .catch(err => {
            console.error('데이터 로딩 오류:', err);
            container.innerHTML = `<div class="error">데이터를 불러오는 중 오류가 발생했습니다: ${err.message}</div>`;
        });
}


// 페이지 로드 시 DB 목록 불러오기
window.onload = function () {
    fetch('../controller/dbController.php')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('db-container');
            container.innerHTML = '';

            const tableArea = document.createElement('div');
            tableArea.id = 'table-container';
            container.appendChild(tableArea);

            for (const db in data) {
                const dbBtn = document.createElement('button');
                dbBtn.className = 'db-btn';
                dbBtn.textContent = db;
                dbBtn.dataset.db = db;
                container.insertBefore(dbBtn, tableArea);
            }

            let currentVisibleDB = null;

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
                            saveTabsToLocalStorage();
                        });

                        tableArea.appendChild(tableBtn);
                    });

                    tableArea.style.display = 'block';
                    currentVisibleDB = selectedDB;
                }
            });

            // ✨ 이 부분이 핵심 수정!
            const openedTabs = JSON.parse(localStorage.getItem('openedTabs') || '[]');
            if (openedTabs.length > 0) {
                let activeTabId = null;

                openedTabs.forEach(tabInfo => {
                    loadTableSchema(tabInfo.dbName, tabInfo.tableName, () => {
                        createTab(tabInfo.dbName, tabInfo.tableName);

                        if (tabInfo.active && !activeTabId) {
                            activeTabId = `tab-${tabInfo.dbName}-${tabInfo.tableName}`.replace(/[^a-zA-Z0-9-]/g, '-');
                            switchTab(activeTabId);
                        }
                    });
                });
            }
        })
        .catch(error => {
            document.getElementById('db-container').innerText = '불러오기 실패: ' + error;
        });
};


// 탭 정보 localStorage에 저장
function saveTabsToLocalStorage() {
    if (tabsList) {
        const tabs = [...tabsList.querySelectorAll('.tab')];
        const openedTabs = tabs.map(tab => {
            const tabId = tab.dataset.tabId;
            const content = document.getElementById(tabId);
            return {
                dbName: content?.dataset.db,
                tableName: content?.dataset.table,
                active: tab.classList.contains('active')
            };
        }).filter(t => t.dbName && t.tableName);

        localStorage.setItem('openedTabs', JSON.stringify(openedTabs));
    }
}
