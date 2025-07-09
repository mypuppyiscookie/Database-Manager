// 전역 상태
const COLORS = {
    modified: 'skyblue',
    newRow: 'lightgreen',
    deleted: 'red'
};

const state = {
    insertRows: [],
    updateCells: [],
    deleteRows: [],
    selectedCell: null,
    isEditing: false
};

const dom = {
    get activeTabContent() {
        return document.querySelector('.tab-content[style*="display: block"]');
    },
    get dbName() {
        return this.activeTabContent?.dataset.db;
    },
    get tableName() {
        return this.activeTabContent?.dataset.table;
    },
    get table() {
        return this.activeTabContent?.querySelector('.data-table table');
    },
    get tbody() {
        return this.table?.querySelector('tbody');
    }
};

// 앱 시작 시 globalClickHandler 한 번만 등록
if (!window.globalClickHandlerRegistered) {
    document.removeEventListener('click', globalClickHandler);
    document.addEventListener('click', globalClickHandler, { once: false, capture: true });
    window.globalClickHandlerRegistered = true;
}

// 전역 클릭 이벤트 핸들러
function globalClickHandler(e) {
    const cellBtn = e.target.closest('.cell-btn');
    if (cellBtn) {
        handleCellClick(cellBtn);
        return;
    }
    if (e.target.matches('#save')) {
        handleSave();
        return;
    }
    if (e.target.matches('#cancel')) {
        handleCancel();
        return;
    }
    if (e.target.matches('#add')) {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (e.handled) return;
        e.handled = true;
        handleAddRow();
        return false;
    }
    if (e.target.matches('#delete')) {
        handleDeleteRow();
        return;
    }
    if (e.target.matches('#refresh')) {
        handleRefresh();
        return;
    }
}

// 셀 클릭
function handleCellClick(button) {
    const td = button.closest('td');
    if (!td) return;

    if (td.querySelector('input')) {
        return;
    }

    if (state.selectedCell) {
        state.selectedCell.style.backgroundColor = '';
    }

    state.selectedCell = td;

    const value = button.textContent;
    const currentInput = dom.activeTabContent?.querySelector('td input');
    if (currentInput) {
        saveCurrentEdit(currentInput);
    }

    const tr = td.closest('tr');
    const key = button.dataset.key;

    if (tr?.hasAttribute("data-is-new")) {
        createEditor(td, value, key);
        return;
    }

    if (key) {
        createEditor(td, value, key);
    }
}

// 셀 편집기 생성
function createEditor(td, value, key) {
    td.innerHTML = '';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cell-editor';
    input.value = value;
    input.defaultValue = value;
    input.dataset.key = key;
    td.appendChild(input);
    input.focus();

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveCurrentEdit(input);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            replaceInputWithButton(td, input.defaultValue);
            td.style.backgroundColor = '';
        }
    });
}

// 편집 저장
function saveCurrentEdit(input) {
    if (!input) return;

    const td = input.closest('td');
    const tr = td.closest('tr');
    const oldValue = input.defaultValue;
    let newValue = input.value.trim();

    if (newValue === "") {
        newValue = null;
    }

    const primaryKey = tr?.dataset.pkName;
    const pkValue = tr?.dataset.pkValue;
    const key = input.dataset.key;

    if (oldValue !== newValue) {
        console.log(
            `[수정] PK(${primaryKey}:${pkValue}) 컬럼(${key}) 값 변경 →`,
            `기존 값: "${oldValue}" → 새 값: "${newValue}"`
        );

        addOrUpdateModifiedCell(primaryKey, pkValue, key, newValue);
        td.style.backgroundColor = COLORS.modified;
        setEditingMode(true);
    } else {
        console.log(
            `[수정] 변경 없음 → PK(${primaryKey}:${pkValue}) 컬럼(${key}) 값 그대로: "${oldValue}"`
        );
        td.style.backgroundColor = '';
    }

    replaceInputWithButton(td, newValue);
}

// 버튼으로 복원
function replaceInputWithButton(td, value) {
    const input = td.querySelector('input');
    const key = input?.dataset.key;
    const btn = document.createElement('button');
    btn.className = 'cell-btn';
    btn.textContent = value === null ? "" : value;
    if (key) btn.dataset.key = key;
    td.innerHTML = '';
    td.appendChild(btn);
}

// 수정된 셀 추가
function addOrUpdateModifiedCell(primaryKey, primaryValue, key, value) {
    if (value === "") {
        value = null;
    }

    const existing = state.updateCells.find(
        (item) =>
            item.primaryKey === primaryKey &&
            String(item.primaryValue) === String(primaryValue) &&
            item.key === key
    );

    if (existing) {
        console.log(
            `[수정 덮어쓰기] PK(${primaryKey}:${primaryValue}) 컬럼(${key}) → 새 값으로 덮어씀: "${existing.value}" → "${value}"`
        );
        existing.value = value;
    } else {
        console.log(
            `[수정 추가] PK(${primaryKey}:${primaryValue}) 컬럼(${key}) → 값: "${value}"`
        );
        state.updateCells.push({
            primaryKey,
            primaryValue,
            key,
            value,
            modifiedAt: new Date().toISOString()
        });
    }

    console.log('현재 updateCells:', state.updateCells);
}

// 로우 추가 핸들러
function handleAddRow() {
    const table = dom.table;
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const columnKeys = [];
    const headerCells = table.querySelectorAll('thead th');
    for (let i = 1; i < headerCells.length; i++) {
        const colName = headerCells[i].textContent.replace(/^🔑\s*/, '');
        columnKeys.push(colName);
    }

    const allRows = Array.from(tbody.querySelectorAll('tr'));

    // 현재 데이터가 있는 행만 찾기
    const dataRows = allRows.filter(tr => {
        return tr.hasAttribute('data-is-new') ||
               Array.from(tr.querySelectorAll('.cell-btn')).some(
                   btn => btn.textContent.trim() !== ""
               );
    });

    const MIN_ROWS = 34;

    let replaceTarget = null;

    if (dataRows.length < MIN_ROWS) {
        // 비어있는 row들 중 가장 위에 있는 거 하나 골라서 대체
        const emptyRows = allRows.filter(tr => {
            return !tr.hasAttribute('data-is-new') &&
                   Array.from(tr.querySelectorAll('.cell-btn')).every(
                       btn => btn.textContent.trim() === ""
                   );
        });

        if (emptyRows.length > 0) {
            replaceTarget = emptyRows[0];
        }
    }

    // 추가할 row 생성
    const newRow = document.createElement('tr');
    newRow.dataset.isNew = "true";
    newRow.style.backgroundColor = COLORS.newRow;

    const indexTd = document.createElement('td');
    indexTd.className = 'row-index';
    indexTd.textContent = replaceTarget
        ? replaceTarget.querySelector('td.row-index')?.textContent || ''
        : tbody.rows.length + 1;
    newRow.appendChild(indexTd);

    for (const key of columnKeys) {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.dataset.key = key;
        input.style.width = '100%';
        td.appendChild(input);
        newRow.appendChild(td);
    }

    if (replaceTarget) {
        tbody.replaceChild(newRow, replaceTarget);
    } else {
        // 어디에 추가할지 결정
        let lastDataRow = null;

        if (dataRows.length > 0) {
            lastDataRow = dataRows[dataRows.length - 1];
        }

        if (lastDataRow) {
            if (lastDataRow.nextSibling) {
                tbody.insertBefore(newRow, lastDataRow.nextSibling);
            } else {
                tbody.appendChild(newRow);
            }
        } else {
            // 데이터가 아무것도 없으면 맨 위
            tbody.insertBefore(newRow, tbody.rows[0] || null);
        }
    }

    // 인덱스 다시 매기기
    Array.from(tbody.rows).forEach((tr, idx) => {
        const indexCell = tr.querySelector('td.row-index');
        if (indexCell) indexCell.textContent = idx + 1;
    });

    state.insertRows.push(newRow);

    setEditingMode(true);
    newRow.scrollIntoView();
}


// 삭제
function handleDeleteRow() {
    const tbody = dom.tbody;
    if (!tbody) return;

    // 커서 초기화
    if (state.nextDeleteRowIndex == null) {
        if (state.selectedCell) {
            const tr = state.selectedCell.closest('tr');
            state.nextDeleteRowIndex = Array.from(tbody.rows).indexOf(tr);
        } else {
            state.nextDeleteRowIndex = 0;
        }
    }

    const rows = Array.from(tbody.rows);

    // if (state.nextDeleteRowIndex >= rows.length) {
    //     alert("더 이상 삭제할 row가 없습니다.");
    //     return;
    // }

    const targetRow = rows[state.nextDeleteRowIndex];

    const pkHeader = dom.activeTabContent?.querySelector('th[data-is-pk="true"]');

    if (!pkHeader) {
        alert("기본키가 없는 테이블은 삭제할 수 없습니다.");
        return;
    }

    const primaryKey = pkHeader.getAttribute('data-column-name') ||
                       pkHeader.textContent.trim().replace(/^🔑\s*/, '');

    const pkValue = targetRow?.dataset.pkValue;

    if (!pkValue) {
        return;
    }

    targetRow.style.backgroundColor = COLORS.deleted;

    const exists = state.deleteRows.some(
        (item) => item.primaryKey === primaryKey && item.primaryValue === pkValue
    );

    if (!exists) {
        state.deleteRows.push({
            primaryKey: primaryKey,
            primaryValue: pkValue,
            deletedAt: new Date().toISOString()
        });
    }

    setEditingMode(true);

    // 다음으로 이동
    state.nextDeleteRowIndex += 1;
}




// 저장
let isSaving = false;
function handleSave() {
    if (isSaving) return;
    isSaving = true;

    const newRows = dom.activeTabContent?.querySelectorAll('tr[data-is-new="true"]') || [];
    const rowsToInsert = [];

    newRows.forEach((tr) => {
        const rowData = {};
        const cells = tr.querySelectorAll('td');
        cells.forEach((cell, idx) => {
            if (idx === 0) return;
            const input = cell.querySelector('input');
            if (input) {
                const key = input.dataset.key;
                let value = input.value.trim();
                if (value === "") {
                    value = null;
                }
                rowData[key] = value;
            }
        });
        if (Object.keys(rowData).length > 0) {
            rowsToInsert.push(rowData);
        }
    });

    const payload = {
        insertRows: rowsToInsert,
        updateCells: state.updateCells,
        deleteRows: state.deleteRows
    };

    console.log("전송할 데이터", payload);

    fetch(`../controller/editController.php?action=save&db=${dom.dbName}&table=${dom.tableName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.text())
        .then(text => {
            console.log("서버 raw 응답:", text);

            try {
                const json = JSON.parse(text);
                console.log("서버 JSON 파싱 성공:", json);

                if (json.status === 'success') {
                    state.insertRows = [];
                    state.updateCells = [];
                    state.deleteRows = [];
                    handleRefresh();
                    setEditingMode(false);
                } else if (json.status === 'error') {
                    alert(`SQL 오류:\n\n${json.message}`);
                }
            } catch (e) {
                console.error("JSON 파싱 실패:", e);
                alert("서버에서 JSON이 아닌 응답이 왔습니다:\n\n" + text);
            }
        })
        .catch(error => {
            console.error('에러 발생:', error);
            alert('에러 발생: ' + error.message);
        })
        .finally(() => {
            isSaving = false;
        });
}

// 취소
function handleCancel() {
    const newRows = dom.activeTabContent?.querySelectorAll('tr[data-is-new="true"]') || [];
    newRows.forEach((row) => row.remove());
    state.insertRows = [];

    const deletedRows =
        dom.activeTabContent?.querySelectorAll('tr[style*="background-color: red"]') || [];
    deletedRows.forEach((row) => (row.style.backgroundColor = ''));

    state.deleteRows = [];
    state.updateCells = [];
    setEditingMode(false);
}

// 새로고침
function handleRefresh() {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        const tabId = activeTab.dataset.tabId;
        const tabContent = document.getElementById(tabId);
        const db = tabContent?.dataset.db;
        const table = tabContent?.dataset.table;
        if (db && table) {
            loadTableData(db, table, tabContent);
        }
    }
}

// 수정되었을 때 저장/취소 버튼 활성화
function setEditingMode(isEditing) {
    state.isEditing = isEditing;

    const container = dom.activeTabContent;
    const btnSave = container?.querySelector('#save');
    const btnCancel = container?.querySelector('#cancel');

    if (btnSave && btnCancel) {
        btnSave.disabled = !isEditing;
        btnCancel.disabled = !isEditing;
    } else {
        console.log('[setEditingMode] 버튼을 찾지 못했습니다.');
    }
}
