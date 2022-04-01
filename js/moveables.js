const moveables = new Map();
const target = { id: 'target1', targetedMoveableId: '' };

fetch('db.json')
  .then(response => { return response.json(); })
  .then(jsonData => init(jsonData));

function init(db) {
  const moveablesBox = document.getElementById('moveablesBox');
  for (let colorData of db.colors) {
    const newElement = createMoveableElement(colorData, moveablesBox);
    moveables.set(newElement.htmlElement.id, newElement);
  }
}

function createMoveableElement(data, parent) {
  const element = document.createElement('div');
  element.id = data.label;
  element.className = 'moveable';
  element.draggable = true;
  element.addEventListener('dragstart', dragStart);
  const image = document.createElement('img');
  image.src = data.imgSrc;
  image.width = 100;
  image.height = 100;
  element.appendChild(image);
  const audio = document.createElement('audio');
  audio.id = data.label + 'Audio';
  audio.src = data.audioSrc;
  element.appendChild(audio);
  parent.appendChild(element);

  return { htmlElement: element, audioElement: audio, data: data };
}

function dragStart(event) {
  const target = event.currentTarget;
  setTimeout(function () {
    target.style.visibility = 'hidden';
  }, 1);
  const style = window.getComputedStyle(target, null);
  event.dataTransfer.setData('text/plain',
    target.id + ',' + (parseInt(style.getPropertyValue('left'), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue('top'), 10) - event.clientY));
}

function dragOver(event) {
  event.preventDefault();
}

function drop(event) {
  const data = event.dataTransfer.getData('text/plain').split(',');
  const offset = data.slice(1);
  const draggedElement = document.getElementById(data[0]);
  setTimeout(function () {
    draggedElement.style.visibility = 'visible';
  }, 1);
  draggedElement.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
  draggedElement.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
  event.preventDefault();
  return draggedElement;
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

function checkAnswerEvent(event) {
  if (checkAnswer()) {
    const targetMoveable = document.getElementById(target.targetedMoveableId)
    targetMoveable.style.outline = '2px dashed lightgreen';
    document.getElementById('newQuestion').disabled = false;
    event.currentTarget.disabled = true;
  }
}

function checkAnswer() {
  let isCorrect = true;
  const targetElement = document.getElementById(target.id)
  const moveableElements = document.getElementsByClassName('moveable');
  for (let moveableElement of moveableElements) {
    if (isObjOnObj(moveableElement, targetElement)) {
      // boolean operation restricts to only the target moveable
      isCorrect &= moveableElement.id === target.targetedMoveableId;
    }
  }
  return isCorrect;
}

// function toggleLock(event) {
//   const parent = event.target.parentElement;
//   if (parent.getAttribute('draggable') === 'true') {
//     parent.setAttribute('draggable', 'false');
//   } else {
//     parent.setAttribute('draggable', 'true');
//   }
// }

function isObjOnObj(a, b) {
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

function setNewQuestion(event) {
  resetMoveables();
  setRandomTarget();
  document.getElementById('checkAnswer').disabled = false;
  event.target.disabled = true;
}

function resetMoveables() {
  const moveableElements = document.getElementsByClassName('moveable');
  for (let moveableElement of moveableElements) {
    moveableElement.style.outline = 'none';
    moveableElement.style.position = '';
    moveableElement.style.left = 'initial';
    moveableElement.style.top = 'initial';
  }
}

function setRandomTarget() {
  let randomIndex = Math.floor(Math.random() * moveables.size);
  let moveableId = Array.from(moveables.values())[randomIndex].htmlElement.id;
  target.targetedMoveableId = moveableId;
  playAudio(moveableId);
}

function playAudio(moveableId) {
  if (moveables.has(moveableId)) {
    moveables.get(moveableId).audioElement.play();
  }
}

// function playAudioFromEvent(event) {
//   playAudio(event.currentTarget.id);
// }

function playTargetAudio() {
  playAudio(target.targetedMoveableId)
}

function newItem(event) {
  const newItem = document.getElementById('feeder').children[0];
  newItem.style.visibility = 'visible';
  playAudio(newItem.id);
  event.currentTarget.disabled = true;
}