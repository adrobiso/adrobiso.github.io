// function dragStart(event) {
//   const target = event.currentTarget;
//   setTimeout(function () {
//     target.style.visibility = 'hidden';
//   }, 1);
//   const style = window.getComputedStyle(target, null);
//   event.dataTransfer.setData('text/plain',
//     target.id + ',' + (parseInt(style.getPropertyValue('left'), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue('top'), 10) - event.clientY));
// }

// function dragOver(event) {
//   event.preventDefault();
// }

// function drop(event) {
//   const data = event.dataTransfer.getData('text/plain').split(',');
//   const offset = data.slice(1);
//   const draggedElement = document.getElementById(data[0]);
//   setTimeout(function () {
//     draggedElement.style.visibility = 'visible';
//   }, 1);
//   draggedElement.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
//   draggedElement.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
//   event.preventDefault();
//   return draggedElement;
// }

let moving = null;

function testPickup(event) {
  const target = event.currentTarget;
  const style = window.getComputedStyle(target, null);
  moving = { element: target, offsetX: parseInt(style.getPropertyValue('left'), 10) - event.clientX, offsetY: parseInt(style.getPropertyValue('top'), 10) - event.clientY };
  event.preventDefault();
}

function testMove(event) {
  if (moving) {
    moving.element.style.left = (event.clientX + moving.offsetX) + 'px';
    moving.element.style.top = (event.clientY + moving.offsetY) + 'px';
    event.preventDefault();
  }
}

function testDrop(event) {
  if (moving) {
    moving = null;
    event.preventDefault();
  }
}

// function reparentOnDrop(event) {
//   const draggedElement = drop(event);
//   event.currentTarget.appendChild(draggedElement);
//   setTimeout(function () {
//     draggedElement.style.left = '0px';
//     draggedElement.style.top = '0px';
//   }, 1);
// }

// function recepticleOnDrop(event) {
//   reparentOnDrop(event);
//   const newItemButton = document.getElementById("newItem");
//   const feeder = document.getElementById("feeder");
//   if (feeder.children.length > 0) {
//     newItemButton.disabled = false;
//   }
// }