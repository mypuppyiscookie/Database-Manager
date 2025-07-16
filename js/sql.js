// SQL 에디터 탭 카운터 초기화
let sqlTabCounter = 1;

// 새로고침 시 탭 카운터 복원
function restoreSqlTabCounter() {
    // 저장된 SQL 탭 카운터 복원
    const savedCounter = localStorage.getItem('sqlTabCounter');
    if (savedCounter) {
        sqlTabCounter = parseInt(savedCounter, 10) || 1;
    }
    
    // 저장된 탭이 있으면 복원
    const savedTabs = JSON.parse(localStorage.getItem('openedTabs') || '[]');
    const sqlTabs = savedTabs.filter(tab => tab.dbName === '_sql');
    
    if (sqlTabs.length > 0) {
        // 기존 SQL 탭이 있으면 카운터 업데이트
        const maxNumber = Math.max(...sqlTabs.map(tab => {
            const match = tab.title?.match(/Script (\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        }));
        
        if (!isNaN(maxNumber) && maxNumber >= 1) {
            sqlTabCounter = maxNumber + 1;
        }
        
        // SQL 탭 복원 (setTimeout을 사용하여 다른 초기화가 완료된 후 실행)
        setTimeout(() => {
            sqlTabs.forEach(tab => {
                if (typeof window.createSqlEditor === 'function') {
                    window.createSqlEditor(tab.title);
                }
            });
        }, 100);
    }
}

// sql-btn 버튼 클릭 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    restoreSqlTabCounter();
    
    const sqlBtn = document.getElementById('sql-btn');
    if (sqlBtn) {
        sqlBtn.addEventListener('click', function() {
            console.log('sql-btn 버튼 클릭됨');
            createSqlEditor();
        });
    }
});

// SQL 에디터 컨테이너 생성 함수
window.createSqlEditor = function(customTitle) {
    const container = document.createElement('div');
    container.className = 'sql-editor-container';
    
    // sql-toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'sql-toolbar';

    // 실행 버튼
    const executeBtn = document.createElement('button');
    executeBtn.id = 'execute-sql';
    executeBtn.className = 'sql-btn';
    executeBtn.textContent = '실행 (F5)';
    executeBtn.onclick = executeSqlQuery;

    // 포맷 버튼
    const formatBtn = document.createElement('button');
    formatBtn.id = 'format-sql';
    formatBtn.className = 'sql-btn';
    formatBtn.textContent = '포맷';
    formatBtn.onclick = formatSql;

    // 지우기 버튼
    const clearBtn = document.createElement('button');
    clearBtn.id = 'clear-sql';
    clearBtn.className = 'sql-btn';
    clearBtn.textContent = '지우기';
    clearBtn.onclick = clearSql;

    // 툴바에 버튼 추가
    toolbar.appendChild(executeBtn);
    toolbar.appendChild(formatBtn);
    toolbar.appendChild(clearBtn);

    // SQL 에디터 컨테이너
    const editorWrapper = document.createElement('div');
    editorWrapper.className = 'sql-editor-wrapper';

    // SQL 입력창
    const textarea = document.createElement('textarea');
    textarea.id = 'sql-query';
    textarea.className = 'sql-query';
    textarea.placeholder = 'SQL 쿼리를 입력하세요...';
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'F5') {
            e.preventDefault();
            executeSqlQuery();
        }
    });

    // 리사이즈 핸들
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    
    // 결과 영역 래퍼
    const resultWrapper = document.createElement('div');
    resultWrapper.className = 'result-wrapper';
    
    // 결과 영역
    const resultDiv = document.createElement('div');
    resultDiv.id = 'sql-result';
    resultDiv.className = 'sql-result';

    // 에디터 래퍼에 에디터 추가
    editorWrapper.appendChild(textarea);
    
    // 결과 래퍼에 결과 영역 추가
    resultWrapper.appendChild(resultDiv);
    
    // 컨테이너에 요소들 추가
    container.appendChild(toolbar);
    container.appendChild(editorWrapper);
    container.appendChild(resizeHandle);
    container.appendChild(resultWrapper);
    
    // 리사이즈 핸들 이벤트 리스너 추가
    let isResizing = false;
    let lastY = 0;
    let editorHeight = 200; // 기본 높이
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        lastY = e.clientY;
        document.body.style.cursor = 'row-resize';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const deltaY = e.clientY - lastY;
        const containerRect = container.getBoundingClientRect();
        const newHeight = Math.max(100, editorHeight + deltaY);
        
        editorWrapper.style.height = newHeight + 'px';
        resultWrapper.style.top = (newHeight + resizeHandle.offsetHeight) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            editorHeight = editorWrapper.offsetHeight;
        }
    });
    
    // 초기 높이 설정
    editorWrapper.style.height = editorHeight + 'px';
    resultWrapper.style.top = (editorHeight + resizeHandle.offsetHeight) + 'px';
    
    // 탭으로 추가
    const tabId = 'sql-editor-' + Date.now();
    
    // loadDb.js의 createTab 함수가 있는지 확인
    if (typeof createTab === 'function') {
        // SQL 쿼리 에디터를 위한 탭 생성
        const tab = document.createElement('div');
        tab.id = tabId;
        tab.className = 'tab-content active';
        tab.dataset.db = '_sql';
        tab.dataset.table = 'query';
        
        // 탭 번호 설정 및 증가
        let tabTitle = customTitle || `📝 Script ${sqlTabCounter++}`;
        if (!customTitle) {
            localStorage.setItem('sqlTabCounter', sqlTabCounter);
        }
        
        // 탭 버튼 생성
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-btn';
        tabButton.innerHTML = tabTitle;
        tabButton.dataset.tabId = tabId;
        tabButton.dataset.tabTitle = tabTitle;
        tabButton.onclick = () => switchTab(tabId);
        
        // 닫기 버튼 추가
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-tab';
        closeBtn.innerHTML = ' &times;';
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            if (typeof closeTab === 'function') {
                closeTab(tabId);
                // 탭이 닫힌 후 저장
                setTimeout(() => {
                    if (typeof saveTabsToLocalStorage === 'function') {
                        saveTabsToLocalStorage();
                    }
                }, 0);
            }
        };
        tabButton.appendChild(closeBtn);
        
        // 탭 컨텐츠 영역 찾기
        const tabContentArea = document.querySelector('.tabs-content');
        const tabButtonsContainer = document.querySelector('.tabs') || tabContentArea?.parentElement?.querySelector('.tabs');
        
        if (tabButtonsContainer && tabContentArea) {
            // 탭 버튼 추가
            tabButtonsContainer.appendChild(tabButton);
            
            // 탭 컨텐츠 추가
            tabContentArea.appendChild(tab);
            
            // 탭 정보 저장
            if (typeof saveTabsToLocalStorage === 'function') {
                const tabInfo = {
                    dbName: '_sql',
                    table: 'query',
                    title: tabTitle,
                    active: true,
                    order: document.querySelectorAll('.tab-btn').length - 1
                };
                
                // 기존 탭 정보 가져오기
                const openedTabs = JSON.parse(localStorage.getItem('openedTabs') || '[]');
                
                // 이미 존재하는 탭인지 확인
                const existingTabIndex = openedTabs.findIndex(t => 
                    t.dbName === '_sql' && t.table === 'query' && t.title === tabTitle
                );
                
                if (existingTabIndex === -1) {
                    // 새 탭 추가
                    openedTabs.push(tabInfo);
                } else {
                    // 기존 탭 업데이트
                    openedTabs[existingTabIndex] = tabInfo;
                }
                
                // 로컬 스토리지에 저장
                localStorage.setItem('openedTabs', JSON.stringify(openedTabs));
                
                // 탭 활성화
                if (typeof switchTab === 'function') {
                    switchTab(tabId);
                }
            }
        }
        
        // 탭 컨텐츠 추가
        tab.appendChild(container);
        const tabsContent = document.querySelector('.tabs-content');
        if (tabsContent) {
            tabsContent.appendChild(tab);
        }
        
        // 탭 활성화
        switchTab(tabId);
    } else {
        // createTab 함수가 없을 경우 body에 직접 추가
        document.body.appendChild(container);
    }
    
    return container;
}

// SQL 쿼리 실행 함수
function executeSqlQuery() {
    const query = document.getElementById('sql-query').value.trim();
    const resultDiv = document.getElementById('sql-result');

    if (!query) {
        resultDiv.innerHTML = '<div class="sql-error">실행할 쿼리를 입력해주세요.</div>';
        return;
    }

    resultDiv.innerHTML = '<div class="sql-loading">쿼리 실행 중...</div>';

    fetch('../controller/executeSql.php', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: `query=${encodeURIComponent(query)}`
    })
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`서버 오류 (${response.status}): ${text || response.statusText}`);
        }
        return response.text().then(text => {
            try {
                return text ? JSON.parse(text) : {};
            } catch (e) {
                console.error('JSON 파싱 오류:', e, '응답 텍스트:', text);
                throw new Error(`서버 응답을 파싱할 수 없습니다: ${text.substring(0, 100)}...`);
            }
        });
    })
    .then(data => {
        if (data.error) {
            resultDiv.innerHTML = `<div class="sql-error">오류: ${data.error}</div>`;
            return;
        }

        if (Array.isArray(data)) {
            if (data.length === 0) {
                resultDiv.innerHTML = '<div class="sql-message">조회된 결과가 없습니다.</div>';
                return;
            }

            let table = '<table class="data-table"><thead><tr>';
            Object.keys(data[0]).forEach(key => {
                table += `<th>${key}</th>`;
            });
            table += '</tr></thead><tbody>';
            data.forEach(row => {
                table += '<tr>';
                Object.values(row).forEach(value => {
                    table += `<td>${value === null ? 'NULL' : value}</td>`;
                });
                table += '</tr>';
            });
            table += '</tbody></table>';
            resultDiv.innerHTML = table;
        } else if (data.affectedRows !== undefined) {
            resultDiv.innerHTML = `<div class="sql-success">성공! ${data.affectedRows}개 행이 영향을 받았습니다.</div>`;
        } else {
            resultDiv.innerHTML = `<div class="sql-message">쿼리가 실행되었습니다. ${JSON.stringify(data)}</div>`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        resultDiv.innerHTML = `<div class="sql-error">오류 발생: ${error.message}</div>`;
    });
}

// SQL 포맷 함수
function formatSql() {
    const sqlInput = document.getElementById('sql-query');
    const sql = sqlInput.value;
    const formatted = sql
        .replace(/\b(SELECT|FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|INSERT|INTO|UPDATE|DELETE|SET|VALUES|AND|OR|JOIN|LEFT|RIGHT|INNER|OUTER|ON)\b/gi, '\n$1 ')
        .replace(/\s+/g, ' ')
        .trim();
    sqlInput.value = formatted;
}

// SQL 지우기 함수
function clearSql() {
    document.getElementById('sql-query').value = '';
    document.getElementById('sql-result').innerHTML = '';
}


// 전역 함수 등록
if (typeof window !== 'undefined') {
    window.createSqlEditor = createSqlEditor;
    window.executeSqlQuery = executeSqlQuery;
    window.formatSql = formatSql;
    window.clearSql = clearSql;
}
