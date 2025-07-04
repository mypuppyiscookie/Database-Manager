// document.querySelectorAll('data-table th').forEach(th => {
//   const resizer = document.createElement('div');
//   resizer.classList.add('resizer');
//   th.appendChild(resizer);

//   let startX, startWidth;

//   resizer.addEventListener('mousedown', function (e) {
//     startX = e.pageX;
//     startWidth = th.offsetWidth;

//     document.documentElement.addEventListener('mousemove', onMouseMove);
//     document.documentElement.addEventListener('mouseup', onMouseUp);
//   });

//   function onMouseMove(e) {
//     const newWidth = startWidth + (e.pageX - startX);
//     th.style.width = newWidth + 'px';
//   }

//   function onMouseUp() {
//     document.documentElement.removeEventListener('mousemove', onMouseMove);
//     document.documentElement.removeEventListener('mouseup', onMouseUp);
//   }
// });
