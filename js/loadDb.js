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

                                    // localStorage에서 탭 정보 불러오기
            const openedTabs = JSON.parse(localStorage.getItem('openedTabs') || '[]');
            if (openedTabs.length > 0) {
                // 순서 정보에 따라 정렬
                const sortedTabs = [...openedTabs].sort((a, b) => (a.order || 0) - (b.order || 0));
                let activeTabInfo = null;
                
                // 활성 탭 정보 찾기
                sortedTabs.forEach(tab => {
                    if (tab.active) {
                        activeTabInfo = tab;
                    }
                });
                
                // 활성 탭이 없으면 마지막으로 활성화된 탭을 찾음
                if (!activeTabInfo && sortedTabs.length > 0) {
                    activeTabInfo = sortedTabs[0];
                }

                // 탭 생성
                const tabCreationPromises = sortedTabs.map(tabInfo => {
                    return new Promise((resolve) => {
                        if (tabInfo.dbName === '_sql') {
                            // SQL 에디터 탭인 경우
                            if (typeof window.createSqlEditor === 'function') {
                                window.createSqlEditor(tabInfo.title);
                            } else {
                                console.error('createSqlEditor 함수를 찾을 수 없습니다.');
                            }
                            resolve();
                        } else {
                            // 일반 테이블 탭인 경우
                            loadTableSchema(tabInfo.dbName, tabInfo.tableName, () => {
                                createTab(tabInfo.dbName, tabInfo.tableName);
                                resolve();
                            });
                        }
                    });
                });

                // 모든 탭이 생성된 후 활성 탭으로 전환
                Promise.all(tabCreationPromises).then(() => {
                    if (activeTabInfo) {
                        const activeTabId = `tab-${activeTabInfo.dbName}-${activeTabInfo.tableName}`.replace(/[^a-zA-Z0-9-]/g, '-');
                        // 약간의 지연을 두고 활성 탭으로 전환 (DOM 업데이트 대기용)
                        setTimeout(() => {
                            const tabElement = document.querySelector(`.tab-btn[data-tab-id="${activeTabId}"]`);
                            if (tabElement) {
                                switchTab(activeTabId);
                            } else if (sortedTabs.length > 0) {
                                // 활성 탭을 찾을 수 없는 경우 첫 번째 탭으로 전환
                                const firstTabId = `tab-${sortedTabs[0].dbName}-${sortedTabs[0].tableName}`.replace(/[^a-zA-Z0-9-]/g, '-');
                                switchTab(firstTabId);
                            }
                        }, 100);
                    } else if (sortedTabs.length > 0) {
                        // 활성 탭 정보가 없는 경우 첫 번째 탭으로 전환
                        const firstTabId = `tab-${sortedTabs[0].dbName}-${sortedTabs[0].tableName}`.replace(/[^a-zA-Z0-9-]/g, '-');
                        setTimeout(() => switchTab(firstTabId), 100);
                    }
                });
            }
        })
        .catch(error => {
            document.getElementById('db-container').innerText = '불러오기 실패: ' + error;
        });
};


// 테이블 데이터 로드
function loadTableData(dbName, tableName, container) {
    fetch(`../controller/getTableData.php?db=${encodeURIComponent(dbName)}&table=${encodeURIComponent(tableName)}`)
        .then(async response => {
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`서버 오류: ${response.status} ${response.statusText}\n${errorText}`);
            }
            try {
                return await response.json();
            } catch (e) {
                const text = await response.text();
                console.error('유효하지 않은 JSON 응답:', text);
                throw new Error('서버에서 유효하지 않은 응답을 받았습니다.');
            }
        })
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
            tableWrapper.appendChild(table);

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

            // 테이블 컨테이너에 테이블 추가
            table.appendChild(tbody);
            
            // edit-bar 생성
            const editBar = document.createElement('div');
            editBar.className = 'edit-bar';

            const btnRefresh = document.createElement('button');
            btnRefresh.id = 'refreshBtn';
            btnRefresh.type = 'button';
            btnRefresh.className = 'action-btn';
            btnRefresh.textContent = '새로고침';
            btnRefresh.onclick = (e) => {
                e.stopPropagation();
                const tabContent = e.target.closest('.tab-content');
                if (tabContent) {
                    const db = tabContent.dataset.db;
                    const table = tabContent.dataset.table;
                    if (db && table) {
                        loadTableData(db, table, tabContent);
                    }
                }
            };

            const btnSave = document.createElement('button');
            btnSave.id = 'saveBtn';
            btnSave.type = 'button';
            btnSave.className = 'action-btn';
            btnSave.textContent = '저장';
            btnSave.disabled = true;
            btnSave.onclick = (e) => {
                e.stopPropagation();
                const tabContent = e.target.closest('.tab-content');
                if (tabContent) {
                    const db = tabContent.dataset.db;
                    const table = tabContent.dataset.table;
                    if (db && table) {
                        // edit.js의 handleSave 함수 호출
                        if (window.handleSave) {
                            window.handleSave();
                        }
                    }
                }
            };

            const btnCancel = document.createElement('button');
            btnCancel.id = 'cancelBtn';
            btnCancel.type = 'button';
            btnCancel.className = 'action-btn';
            btnCancel.textContent = '취소';
            btnCancel.disabled = true;
            btnCancel.onclick = (e) => {
                e.stopPropagation();
                const tabContent = e.target.closest('.tab-content');
                if (tabContent) {
                    const db = tabContent.dataset.db;
                    const table = tabContent.dataset.table;
                    if (db && table) {
                        loadTableData(db, table, tabContent);
                    }
                }
                // edit.js의 handleCancel 함수 호출
                if (window.handleCancel) {
                    window.handleCancel();
                }
            };

            const btnAdd = document.createElement('button');
            btnAdd.type = 'button';
            btnAdd.className = 'action-btn';
            btnAdd.textContent = '로우 추가';
            btnAdd.onclick = (e) => {
                e.stopPropagation();
                handleAddRow();
            };

            const btnDelete = document.createElement('button');
            btnDelete.type = 'button';
            btnDelete.className = 'action-btn';
            btnDelete.textContent = '로우 삭제';
            btnDelete.onclick = (e) => {
                e.stopPropagation();
                // 삭제 로직 추가
            };

            editBar.appendChild(btnRefresh);
            editBar.appendChild(btnSave);
            editBar.appendChild(btnCancel);
            editBar.appendChild(btnAdd);
            editBar.appendChild(btnDelete);

            // 테이블과 editBar를 감싸는 컨테이너
            const tableContainer = document.createElement('div');
            tableContainer.className = 'table-container';
            tableContainer.appendChild(tableWrapper);
            tableContainer.appendChild(editBar);
            
            // 기존 컨텐츠 클리어하고 새로 구성
            container.innerHTML = '';
            container.appendChild(tableContainer);

            const event = new Event('editBarReady');
            document.dispatchEvent(event);
        })
        .catch(err => {
            console.error('데이터 로딩 오류:', err);
            container.innerHTML = `<div class="error">데이터를 불러오는 중 오류가 발생했습니다: ${err.message}</div>`;
        });
}


// 탭 관련 전역 변수
let tabsContent = document.querySelector('.tabs-content');

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
    const contentArea = document.querySelector('.content-bar');

    if (!tabsContent) {
        // 탭 영역 초기 세팅
        tabsContent = document.createElement('div');
        tabsContent.id = 'tabs-content';
        tabsContent.className = 'tabs-content';
        contentArea.appendChild(tabsContent);
    }

    const tabId = `tab-${dbName}-${tableName}`.replace(/[^a-zA-Z0-9-]/g, '-');

    const existingTab = document.getElementById(tabId);
    if (existingTab) {
        console.log("[createTab] 기존 탭 복원 → 재로딩:", dbName, tableName, tabId);
        switchTab(tabId);
        
        //반드시 다시 로딩 시도
        loadTableData(dbName, tableName, existingTab);
        return;
    }

    // 새 탭 버튼 생성
    const tab = document.createElement('button');
    tab.className = 'tab-btn';
    tab.innerHTML = `📋 ${tableName}`;
    tab.dataset.tabId = tabId;
    tab.dataset.db = dbName;
    tab.dataset.table = tableName;
    tab.onclick = () => {
        switchTab(tabId);
        saveTabsToLocalStorage();

        //탭 클릭 시에도 dataset 이용해 재로딩
        const content = document.getElementById(tabId);
        if (content) {
            const db = content.dataset.db;
            const table = content.dataset.table;
            if (db && table) {
                loadTableData(db, table, content);
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

    // 탭 컨테이너 가져오기 또는 생성
    let tabsContainer = document.querySelector('.tabs');
    if (!tabsContainer) {
        tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs';
        const contentBar = document.querySelector('.content-bar');
        if (contentBar.firstChild) {
            contentBar.insertBefore(tabsContainer, contentBar.firstChild);
        } else {
            contentBar.appendChild(tabsContainer);
        }
    }

    // localStorage에서 탭 순서 정보 가져오기
    const openedTabs = JSON.parse(localStorage.getItem('openedTabs') || '[]');
    const currentTabIndex = openedTabs.findIndex(t => 
        t.dbName === dbName && t.tableName === tableName
    );

    if (currentTabIndex >= 0 && tabsContainer.children.length > 0) {
        // 저장된 순서에 따라 탭 삽입
        let inserted = false;
        Array.from(tabsContainer.children).some((child, index) => {
            const childDb = child.dataset.db;
            const childTable = child.dataset.table;
            if (!childDb || !childTable) return false;
            
            const childTabIndex = openedTabs.findIndex(t => 
                t.dbName === childDb && t.tableName === childTable
            );
            
            if (childTabIndex > currentTabIndex) {
                tabsContainer.insertBefore(tab, child);
                inserted = true;
                return true; // some 메소드 종료
            }
            return false;
        });
        
        if (!inserted) {
            tabsContainer.appendChild(tab);
        }
    } else {
        // 순서 정보가 없거나 첫 번째 탭인 경우 그냥 추가
        tabsContainer.appendChild(tab);
    }
    tabsContent.appendChild(tabContent);

    loadTableSchema(dbName, tableName, () => {
        loadTableData(dbName, tableName, tabContent);
        switchTab(tabId);
    });
}


// 탭 전환 함수
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    // 활성화된 탭에 data-tab-active 클래스 추가 (오류 방지)
    const activeTab = document.querySelector(`.tab-btn[data-tab-id="${tabId}"]`);
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
    const tab = document.querySelector(`.tab-btn[data-tab-id="${tabId}"]`);
    const content = document.getElementById(tabId);

    if (tab && content) {
        tab.remove();
        content.remove();

        const tabsContainer = document.querySelector('.tabs');
        if (tabsContainer && tabsContainer.children.length === 0) {
            tabsContainer.remove();
            tabsContent.remove();
            tabsContent = null;
            localStorage.removeItem('openedTabs');
        } else {
            const firstTab = document.querySelector('.tab-btn');
            if (firstTab && firstTab.dataset.tabId) {
                switchTab(firstTab.dataset.tabId);
            }
        }
    }
}


// 탭 정보 localStorage에 저장
function saveTabsToLocalStorage() {
    const tabs = document.querySelectorAll('.tab-btn');
    const openedTabs = [];
    let activeTabId = null;
    
    // 현재 활성 탭 찾기
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        activeTabId = activeTab.dataset.tabId;
    }

    // 탭 정보 수집
    tabs.forEach((tab, index) => {
        const tabId = tab.dataset.tabId;
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
            openedTabs.push({
                dbName: tabContent.dataset.db,
                tableName: tabContent.dataset.table,
                active: tabId === activeTabId, // 현재 활성 탭인지 표시
                order: index // 탭의 순서 정보
            });
        }
    });

    localStorage.setItem('openedTabs', JSON.stringify(openedTabs));
}
