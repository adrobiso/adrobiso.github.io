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

function elementsAreOverlapping(a, b) {
  const al = a.offsetLeft;
  const ar = a.offsetLeft + a.offsetWidth;
  const bl = b.offsetLeft;
  const br = b.offsetLeft + b.offsetWidth;

  const at = a.offsetTop;
  const ab = a.offsetTop + a.offsetHeight;
  const bt = b.offsetTop;
  const bb = b.offsetTop + b.offsetHeight;

  if (bl > ar || br < al) { return false; }//overlap not possible
  if (bt > ab || bb < at) { return false; }//overlap not possible

  return true;
}