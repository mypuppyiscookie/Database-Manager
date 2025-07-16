document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.side-bar');
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    // 마우스 다운 이벤트 리스너
    sidebar.addEventListener('mousedown', function(e) {
        // 오른쪽 테두리 근처에서만 리사이즈 시작
        const handleWidth = 6;
        const rightEdge = sidebar.getBoundingClientRect().right;
        
        if (e.clientX >= rightEdge - handleWidth && e.clientX <= rightEdge + handleWidth) {
            isResizing = true;
            startX = e.clientX;
            startWidth = sidebar.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', stopResize);
            e.preventDefault();
            e.stopPropagation();
        }
    });

    // 마우스 무브 이벤트 핸들러
    function handleMouseMove(e) {
        if (!isResizing) return;
        
        const width = startWidth + (e.clientX - startX);
        
        // 최소 너비 제한 (토글 기능 제거)
        if (width >= 200) {  // 최소 너비 200px로 제한
            sidebar.style.width = width + 'px';
        }
    }

    // 리사이즈 종료
    function stopResize() {
        isResizing = false;
        document.body.style.cursor = 'default';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResize);
    }

    // 더블 클릭으로 토글 (기능 유지)
    sidebar.addEventListener('dblclick', function(e) {
        const rightEdge = sidebar.getBoundingClientRect().right;
        if (e.clientX >= rightEdge - 10 && e.clientX <= rightEdge + 10) {
            if (sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
                sidebar.style.width = '250px';
            } else {
                sidebar.classList.add('collapsed');
                sidebar.style.width = '25px';
            }
        }
    });
});
