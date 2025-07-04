document.addEventListener('editBarReady', () => {

    // 셀 색상 정의
    const COLORS = {
        modified: 'skyblue',
        newRow: 'lightgreen',
        deleted: 'red'
    };

    
    // 선택한 셀을 저장할 객체
    const state = {
        insertRows: [],
        updateCells: [],
        deleteRows: [],
        selectedCell: null,
        nextDeleteRowIndex: 0,
        isEditing: false,
        originalValues: new Map()
    };


    // DOM 요소를 저장할 객체
    const dom = {
        get contentArea() { return document.querySelector('.content-bar'); },
        get dbName() { return this.contentArea?.dataset.db; },
        get tableName() { return this.contentArea?.dataset.table; },
        get table() { return document.querySelector('.data-table'); },
        get tbody() { return this.table?.querySelector('tbody'); }
    };


    // 전역 클릭 이벤트 핸들러
    document.removeEventListener('click', globalClickHandler);
    document.addEventListener('click', globalClickHandler);

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
            handleAddRow();
            return;
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


    // 셀 클릭 이벤트 핸들러
    function handleCellClick(button) {
        if (!button) return;

        const td = button.closest('td');
        if (!td) return;

        const value = button.textContent;

        const currentInput = document.querySelector('td input');
        if (currentInput) {
            saveCurrentEdit(currentInput);
        }

        const tr = td.closest('tr');
        if (!tr) return;

        const key = button.dataset.key;

        if (tr.hasAttribute("data-is-new")) {
            createEditor(td, value, key);
            state.selectedCell = td;
            return;
        }

        const { pkValue, pkName } = tr.dataset;

        if (key && pkName && pkValue) {
            createEditor(td, value, key);
            state.selectedCell = td;
        }
    }


    // 현재 편집 중인 셀 저장
    function saveCurrentEdit(input) {
        if (!input) return;

        const td = input.closest('td');
        const oldValue = input.defaultValue;
        const newValue = input.value.trim();

        if (oldValue !== newValue) {
            const row = td.closest('tr');
            const { pkValue, pkName } = row.dataset;
            const key = input.dataset.key;

            if (pkValue && pkName && key) {
                addOrUpdateModifiedCell(pkName, pkValue, key, newValue);
                td.style.backgroundColor = COLORS.modified;
            }
        } else {
            td.style.backgroundColor = '';
        }

        replaceInputWithButton(td, input.value);
    }


    // 편집할 input 생성
    function createEditor(td, value, key) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.defaultValue = value;
        input.dataset.key = key;
        input.className = 'cell-editor';
        input.style.width = '100%';

        input.addEventListener('focus', () => input.select());
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


    // 편집할 input을 버튼으로 변경
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

    function addOrUpdateModifiedCell(primaryKey, primaryValue, key, value) {
        const existing = state.updateCells.find(item =>
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

    function handleAddRow() {
        const table = dom.table;
        const tbody = dom.tbody;

        let insertIndex = 0;

        if (state.selectedCell) {
            const currentRow = state.selectedCell.closest('tr');
            insertIndex = Array.from(tbody.rows).indexOf(currentRow) + 1;
        } else {
            const rows = Array.from(tbody.rows);
            for (let i = rows.length - 1; i >= 0; i--) {
                if (rows[i].querySelector('.cell-btn')) {
                    insertIndex = i + 1;
                    break;
                }
            }
        }

        const columnKeys = [];
        const headerCells = table.querySelectorAll('thead th');
        for (let i = 1; i < headerCells.length; i++) {
            columnKeys.push(headerCells[i].textContent.replace(/^🔑\s*/, ''));
        }

        const newRows = Array.from(tbody.querySelectorAll('tr[data-is-new="true"]'));
        if (newRows.some(tr => Array.from(tbody.rows).indexOf(tr) === insertIndex)) {
            console.log("이미 같은 위치에 새 행이 있습니다. 추가하지 않습니다.");
            return;
        }

        const rows = Array.from(tbody.rows);
        for (let i = insertIndex; i < rows.length; i++) {
            const idxCell = rows[i].querySelector('.row-index');
            if (idxCell) {
                idxCell.textContent = Number(idxCell.textContent) + 1;
            }
        }

        const newRowIndex = insertIndex + 1;

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

        if (insertIndex >= tbody.rows.length) {
            tbody.appendChild(newRow);
        } else {
            tbody.insertBefore(newRow, tbody.rows[insertIndex]);
        }

        state.insertRows.push({
            rowIndex: insertIndex,
            rowData: columnKeys.reduce((acc, k) => {
                acc[k] = "";
                return acc;
            }, {})
        });

        setEditingMode(true);
    }



    // 삭제 버튼 클릭 이벤트 핸들러
    function handleDeleteRow() {
        const tbody = dom.tbody;
        if (!tbody) return;
    
        let targetRow;
        let rowIndex;
    
        if (state.selectedCell) {
            targetRow = state.selectedCell.closest('tr');
            rowIndex = Array.from(tbody.rows).indexOf(targetRow);
            if (rowIndex === -1) {
                return;
            }
        } else {
            rowIndex = 0;
            targetRow = tbody.rows[rowIndex];
        }
    
        if (!targetRow) return;
    
        let pkName = null;
        let pkValue = null;
    
        // 1. data-is-pk 속성으로 PK 헤더 찾기
        let pkHeader = document.querySelector('th[data-is-pk="true"]');
        
        // 2. data-is-pk가 없으면 🔑 이모지가 있는 헤더 찾기
        if (!pkHeader) {
            const allHeaders = document.querySelectorAll('th');
            for (const header of allHeaders) {
                if (header.textContent.includes('🔑')) {
                    pkHeader = header;
                    break;
                }
            }
        }
        
        // PK 헤더를 찾은 경우에만 처리
        if (pkHeader) {
            // data-column-name 속성이 있으면 우선 사용, 없으면 헤더 텍스트에서 🔑 이모지 제거
            pkName = pkHeader.getAttribute('data-column-name') || 
                    pkHeader.textContent.trim().replace(/^[🔑🔑]\s*/, '');
            
            // data-key 속성으로 셀 버튼 찾기
            const pkCellBtn = targetRow.querySelector('.cell-btn[data-key="' + pkName + '"]');
            
            if (pkCellBtn) {
                pkValue = pkCellBtn.textContent.trim();
            } else {
                // PK 셀을 찾지 못한 경우 삭제 중단
                return;
            }
        } else {
            // PK 헤더를 찾지 못한 경우 삭제 중단
            return;
        }
    
        targetRow.style.backgroundColor = COLORS.deleted;
    
        const exists = state.deleteRows.some(
            item => item.primaryKey === pkName && item.primaryValue === pkValue
        );
    
        if (!exists) {
            state.deleteRows.push({
                primaryKey: pkName,
                primaryValue: pkValue,
                deletedAt: new Date().toISOString()
            });
        }
    
        const nextRow = tbody.rows[rowIndex + 1];
        if (nextRow) {
            const cells = nextRow.getElementsByClassName('cell-btn');
            if (cells.length > 0) {
                state.selectedCell = cells[0];
                state.selectedCell.focus();
            }
        }
    
        setEditingMode(true);
    }
    

    let isSaving = false;

    function handleSave() {
        if (isSaving) {
            console.log("이미 저장 중입니다. 중복 실행 방지됨.");
            return;
        }
        isSaving = true;

        setEditingMode(false);

        const currentInput = document.querySelector('td input');
        if (currentInput) {
            saveCurrentEdit(currentInput);
        }

        const newRows = Array.from(document.querySelectorAll('tr[data-is-new="true"]'));
        newRows.forEach((tr) => {
            const rowData = {};
            const headers = Array.from(dom.table.querySelectorAll('th'));

            headers.forEach((header, index) => {
                if (index === 0) return;

                const key = header.textContent.trim().replace(/^🔑\s*/, '');
                if (!key) return;

                const cell = tr.cells[index];
                if (!cell) return;

                let value = '';
                const input = cell.querySelector('input');
                if (input) {
                    value = input.value;
                } else if (cell.textContent) {
                    value = cell.textContent.trim();
                }

                if (value !== '') {
                    rowData[key] = value;
                }
            });

            const cleanRowData = {};
            Object.entries(rowData).forEach(([key, value]) => {
                if (!/^\d+$/.test(key) && key !== 'rowIndex') {
                    cleanRowData[key] = value;
                }
            });

            if (Object.keys(cleanRowData).length > 0) {
                state.insertRows.push(cleanRowData);
            }
        });

        const payload = {
            insertRows: state.insertRows,
            updateCells: state.updateCells,
            deleteRows: state.deleteRows
        };

        console.log('전송할 데이터:', JSON.parse(JSON.stringify(payload)));

        fetch(`../controller/editController.php?action=save&db=${dom.dbName}&table=${dom.tableName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error("서버 응답 파싱 오류", e);
                    console.log("서버에서 온 데이터:", text);
                    alert(`SQL 오류:\n\n${text}`);
                    throw e;
                }
            });
        })
        .then(result => {
            console.log('서버 응답:', result);

            if (result.status === 'error') {
                alert(`SQL 오류:\n\n${result.message}`);
            }
            // 성공 시 alert 안 띄우기
        })
        .catch(e => {
            console.error('저장 중 오류:', e);
            alert('SQL 오류:\n\n' + e.message);
        })
        .finally(() => {
            isSaving = false;
        });
    }


    function handleCancel() {
        // 편집 중인 셀이 있으면 되돌리기
        const currentInput = document.querySelector('td input');
        if (currentInput) {
            const td = currentInput.closest('td');
            const originalValue = currentInput.defaultValue;
            replaceInputWithButton(td, originalValue);
        }

        // 삭제된 행 복구
        const deletedRows = document.querySelectorAll('tr[style*="background-color: red"]');
        deletedRows.forEach(row => {
            row.style.backgroundColor = '';
        });

        // 삭제 대기 목록 초기화
        state.deleteRows = [];

        // 새로 추가된 행 제거 (data-is-new 속성이 있는 행)
        const newRows = document.querySelectorAll('tr[data-is-new]');
        newRows.forEach(row => {
            row.remove();
        });
        state.insertRows = [];

        // 편집 모드 해제
        setEditingMode(false);
    }

    function handleRefresh() {
        location.reload();
    }

    function setEditingMode(isEditing) {
        state.isEditing = isEditing;
    }
});
