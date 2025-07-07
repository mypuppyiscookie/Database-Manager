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
        return this.activeTabContent?.querySelector('.data-table');
    },
    get tbody() {
        return this.table?.querySelector('tbody');
    }
};

// 앱 시작 시 globalClickHandler 한 번만 등록
if (!window.globalClickHandlerRegistered) {
    // 기존에 등록된 이벤트 리스너 제거 (안전을 위해)
    document.removeEventListener('click', globalClickHandler);
    
    // 새 이벤트 리스너 등록
    document.addEventListener('click', globalClickHandler, { once: false, capture: true });
    
    // 등록 플래그 설정
    window.globalClickHandlerRegistered = true;
    console.log('Global click handler registered');
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
        console.log('Add button clicked');
        e.stopImmediatePropagation();
        e.preventDefault();
        
        // 이미 처리 중인지 확인
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

    // 현재 선택된 셀의 스타일 초기화
    if (state.selectedCell) {
        state.selectedCell.style.backgroundColor = '';
    }
    
    // 새로 선택된 셀에 스타일 적용
    td.style.backgroundColor = '#e6f7ff';
    
    // 선택된 셀 업데이트
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

    const { pkValue, primaryKey } = tr?.dataset || {};
    if (key && primaryKey && pkValue) {
        createEditor(td, value, key);
    }
}

// 셀 편집기 생성
function createEditor(td, value, key) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.defaultValue = value;
    input.dataset.key = key;
    input.className = 'cell-editor';
    input.style.width = '100%';

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

    td.innerHTML = '';
    td.appendChild(input);
    input.focus();
}

// 편집 저장
function saveCurrentEdit(input) {
    if (!input) return;

    const td = input.closest('td');
    const oldValue = input.defaultValue;
    const newValue = input.value.trim();

    if (oldValue !== newValue) {
        const row = td.closest('tr');
        const { pkValue, primaryKey } = row?.dataset || {};
        const key = input.dataset.key;
        if (primaryKey && pkValue && key) {
            addOrUpdateModifiedCell(primaryKey, pkValue, key, newValue);
            td.style.backgroundColor = COLORS.modified;
        }
    } else {
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
    btn.textContent = value;
    if (key) btn.dataset.key = key;

    td.innerHTML = '';
    td.appendChild(btn);
}

// 수정된 셀 추가
function addOrUpdateModifiedCell(primaryKey, primaryValue, key, value) {
    const existing = state.updateCells.find(
        (item) => item.primaryKey === primaryKey &&
                  String(item.primaryValue) === String(primaryValue) &&
                  item.key === key
    );

    if (existing) {
        existing.value = value;
    } else {
        state.updateCells.push({
            primaryKey,
            primaryValue,
            key,
            value,
            modifiedAt: new Date().toISOString()
        });
    }
}

// 로우 추가 핸들러
function handleAddRow() {
    const table = document.querySelector('.data-table table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const columnKeys = [];
    const headerCells = table.querySelectorAll('thead th');
    for (let i = 1; i < headerCells.length; i++) {
        const colName = headerCells[i].textContent.replace(/^🔑\s*/, '');
        columnKeys.push(colName);
    }

    const existingNewRows = tbody.querySelectorAll('tr[data-is-new="true"]').length;
    const newRowIndex = tbody.rows.length + 1;

    const newRow = document.createElement('tr');
    newRow.dataset.isNew = "true";
    newRow.style.backgroundColor = COLORS.newRow;

    const indexTd = document.createElement('td');
    indexTd.className = 'row-index';
    indexTd.textContent = newRowIndex;
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

    tbody.appendChild(newRow);
    newRow.scrollIntoView();

}

// 삭제
function handleDeleteRow() {
    const tbody = dom.tbody;
    if (!tbody) return;

    let targetRow;

    if (state.selectedCell) {
        targetRow = state.selectedCell.closest('tr');
    } else {
        targetRow = tbody.rows[0];
    }

    if (!targetRow) return;

    let pkHeader = dom.activeTabContent?.querySelector('th[data-is-pk="true"]');

    // PK 없는 테이블이면 삭제 불가능
    if (!pkHeader) {
        alert("기본키가 없는 테이블은 삭제할 수 없습니다.");
        return;
    }

    const primaryKey = pkHeader.getAttribute('data-column-name') ||
                   pkHeader.textContent.trim().replace(/^🔑\s*/, '');

    const pkCellBtn = targetRow.querySelector(`.cell-btn[data-key="${primaryKey}"]`);
    if (!pkCellBtn) {
        alert("삭제할 row의 PK 값을 찾을 수 없습니다.");
        return;
    }

    const pkValue = pkCellBtn.textContent.trim();

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
                const value = input.value;
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
    .then(r => r.json())
    .then(result => {
        console.log('서버 응답', result);
        if (result.status === 'success') {
            // 상태 초기화
            state.insertRows = [];
            state.updateCells = [];
            state.deleteRows = [];
            
            // 테이블 새로고침
            handleRefresh();
        } else if (result.status === 'error') {
            alert(`SQL 오류:\n\n${result.message}`);
        }
    })
    .catch(error => {
        console.error('에러 발생:', error);
        alert('저장 중 오류가 발생했습니다.');
    })
    .finally(() => {
        isSaving = false;
    });
}

// 취소
function handleCancel() {
    const newRows = dom.activeTabContent?.querySelectorAll('tr[data-is-new="true"]') || [];
    newRows.forEach(row => row.remove());
    state.insertRows = [];

    const deletedRows = dom.activeTabContent?.querySelectorAll('tr[style*="background-color: red"]') || [];
    deletedRows.forEach(row => row.style.backgroundColor = '');

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

// 편집 모드 on/off
function setEditingMode(isEditing) {
    state.isEditing = isEditing;
}
