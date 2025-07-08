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
        console.log('Add button clicked');
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

    // 기존 로우도 PK 없어도 수정 가능하도록 변경
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
        (item) =>
            item.primaryKey === primaryKey &&
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

    const dataRows = allRows.filter(tr => {
        return Array.from(tr.querySelectorAll('.cell-btn')).some(
            btn => btn.textContent.trim() !== ""
        );
    });

    const MIN_ROWS = 29;

    // 어디에 추가할지 referenceRow를 찾음
    let referenceRow = null;

    if (state.selectedCell) {
        referenceRow = state.selectedCell.closest('tr')?.nextSibling;
    } else {
        let lastDataRow = null;
        for (let i = allRows.length - 1; i >= 0; i--) {
            const tr = allRows[i];
            const hasData = Array.from(tr.querySelectorAll('.cell-btn')).some(
                btn => btn.textContent.trim() !== ""
            );
            if (hasData) {
                lastDataRow = tr;
                break;
            }
        }
        if (lastDataRow) {
            referenceRow = lastDataRow.nextSibling;
        }
    }

    // referenceRow가 빈 row인지 확인
    let replaceTarget = null;

    if (referenceRow && dataRows.length < MIN_ROWS) {
        const isEmpty = Array.from(referenceRow.querySelectorAll('.cell-btn')).every(
            btn => btn.textContent.trim() === ""
        );
        if (isEmpty) {
            replaceTarget = referenceRow;
        }
    }

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
    } else if (referenceRow && tbody.contains(referenceRow)) {
        tbody.insertBefore(newRow, referenceRow);
    } else {
        tbody.appendChild(newRow);
    }

    newRow.scrollIntoView();

    // index 재정렬
    Array.from(tbody.rows).forEach((tr, idx) => {
        const indexCell = tr.querySelector('td.row-index');
        if (indexCell) indexCell.textContent = idx + 1;
    });
}


// 삭제
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

    const dataRows = allRows.filter(tr => {
        return tr.hasAttribute('data-is-new') ||
               Array.from(tr.querySelectorAll('.cell-btn')).some(
                   btn => btn.textContent.trim() !== ""
               );
    });

    const MIN_ROWS = 29;

    let lastDataRow = null;

    if (dataRows.length > 0) {
        lastDataRow = dataRows[dataRows.length - 1];
    }

    let replaceTarget = null;

    if (lastDataRow) {
        const nextRow = lastDataRow.nextElementSibling;

        if (nextRow && !nextRow.hasAttribute('data-is-new')) {
            const isEmpty = Array.from(nextRow.querySelectorAll('.cell-btn')).every(
                btn => btn.textContent.trim() === ""
            );
            if (isEmpty) {
                replaceTarget = nextRow;
            }
        }
    } else {
        // 데이터가 아예 없으면 → 맨 위의 첫 빈 row를 replace
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
    } else if (lastDataRow) {
        // 데이터가 있으면 → lastDataRow 뒤에 insert
        if (lastDataRow.nextSibling) {
            tbody.insertBefore(newRow, lastDataRow.nextSibling);
        } else {
            tbody.appendChild(newRow);
        }
    } else {
        // 데이터가 전혀 없으면 append
        tbody.appendChild(newRow);
    }

    newRow.scrollIntoView();

    // index 재정렬
    Array.from(tbody.rows).forEach((tr, idx) => {
        const indexCell = tr.querySelector('td.row-index');
        if (indexCell) indexCell.textContent = idx + 1;
    });
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
        .then((r) => r.json())
        .then((result) => {
            console.log('서버 응답', result);
            if (result.status === 'success') {
                state.insertRows = [];
                state.updateCells = [];
                state.deleteRows = [];
                handleRefresh();
            } else if (result.status === 'error') {
                alert(`SQL 오류:\n\n${result.message}`);
            }
        })
        .catch((error) => {
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

// 편집 모드 on/off
function setEditingMode(isEditing) {
    state.isEditing = isEditing;
}
