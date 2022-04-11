let moving = null;

function startDrag(event) {
  const target = event.currentTarget;
  const style = window.getComputedStyle(target, null);
  moving = { element: target, offsetX: parseInt(style.getPropertyValue('left'), 10) - event.clientX, offsetY: parseInt(style.getPropertyValue('top'), 10) - event.clientY };
  event.preventDefault();
}

function drag(event) {
  if (moving) {
    moving.element.style.left = (event.clientX + moving.offsetX) + 'px';
    moving.element.style.top = (event.clientY + moving.offsetY) + 'px';
    event.preventDefault();
  }
}

function cancelDrag(event) {
  endDrag(event);
}

function endDrag(event) {
  if (moving) {
    moving = null;
    event.preventDefault();
  }
}