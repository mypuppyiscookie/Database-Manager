

//                 // 테이블 본문 (각 행 생성)
//                 const tbody = document.createElement('tbody'); //본문 데이터를 담을 <tbody> 생성

//                 data.forEach((row, index) => { //JSON 배열 data의 각 행을 반복해서 처리
//                     const tr = document.createElement('tr'); //각 데이터 행을 위한 <tr> 생성

//                     //인덱스 추가 
//                     const indexTd = document.createElement('td');
//                     indexTd.textContent = index + 1;
//                     indexTd.className = 'row-index';
//                     tr.appendChild(indexTd); // 첫 번째로 추가

//                     for (const key in row) { //한 행 안에서 모든 필드(key-value 쌍)를 꺼내는 반복문
//                         const td = document.createElement('td'); //<td> 를 만들고

//                         const btn = document.createElement('button');
//                         btn.className = 'cell-btn';
//                         btn.textContent = row[key]; //해당 필드 값(row[key])을 버튼 안에 넣기
                        
//                         btn.dataset.db = dbName; 
//                         btn.dataset.key = key; //어떤 칼럼인가
//                         btn.dataset.value = row[key]; //값
//                         btn.dataset.id = row[primaryKey]; //기본키 값

//                         td.appendChild(btn); //버튼을 <td>에 추가
//                         tr.appendChild(td); //만든 셀을 <tr>에 추가
//                     }
//                     tbody.appendChild(tr); //<tbody>에 <tr> 추가
//                 });
//                 table.appendChild(tbody);

//                 contentArea.appendChild(table); //화면에 테이블 출력
//             })
//             //에러 발생 시 콘솔 로그
//             .catch(err => {
//                 console.error('데이터 로딩 오류:', err);
//             });
//     }
// });


// function initColumnResize(table) {
//     const ths = table.querySelectorAll('th');
//     ths.forEach(th => {
//         const resizer = th.querySelector('.resizer');
//         if (!resizer) return;

//         let startX, startWidth;

//         resizer.addEventListener('mousedown', e => {
//             startX = e.pageX;
//             startWidth = th.offsetWidth;

//             const onMouseMove = e => {
//                 const newWidth = startWidth + (e.pageX - startX);
//                 th.style.width = newWidth + 'px';
//             };

//             const onMouseUp = () => {
//                 document.removeEventListener('mousemove', onMouseMove);
//                 document.removeEventListener('mouseup', onMouseUp);
//             };

//             document.addEventListener('mousemove', onMouseMove);
//             document.addEventListener('mouseup', onMouseUp);
//         });
//     });
// }
