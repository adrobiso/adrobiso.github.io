const moveables = new Map();
const question = { htmlElement: null, answerElement: null };
let db;

fetch('db.json')
  .then(response => { return response.json(); })
  .then(jsonData => init(jsonData));

function init(jsonData) {
  db = jsonData;
  const categorySelectElement = document.getElementById('categorySelect');
  setCategoryOptions(db, categorySelectElement);

  const moveablesBox = document.getElementById('moveablesBox');
  createMoveables(db[categorySelectElement.value], moveablesBox);

  question.htmlElement = document.getElementById('target1');
}

function changeCategory(event) {
  clearMoveables();
  reset();
  const moveablesBox = document.getElementById('moveablesBox');
  createMoveables(db[event.target.value], moveablesBox);
}

function clearMoveables() {
  for (let moveable of moveables.values()) {
    moveable.htmlElement.remove();
  }
  moveables.clear();
}

function setCategoryOptions(db, categorySelectElement) {
  for (let category of Object.keys(db)) {
    const option = document.createElement("option");
    option.text = category;
    categorySelectElement.add(option);
  }
}

function createMoveables(categoryData, parentElement) {
  for (let data of categoryData) {
    const newElement = createMoveableElement(data, parentElement);
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

function checkAnswerEvent(event) {
  if (checkAnswer(question)) {
    question.answerElement.style.outline = '2px dashed lightgreen';
    document.getElementById('newQuestion').disabled = false;
    event.currentTarget.disabled = true;
  }
}

function checkAnswer(question) {
  let isAnswerOverlapping = false;
  let isOtherOverlapping = false;
  for (let moveable of moveables.values()) {
    if (isObjOnObj(moveable.htmlElement, question.htmlElement)) {
      if (moveable.htmlElement.id === question.answerElement.id) {
        isAnswerOverlapping = true;
      } else {
        isOtherOverlapping = true;
      }
    }
  }
  return isAnswerOverlapping === true && isOtherOverlapping === false;
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
  setRandomAnswer();
  document.getElementById('checkAnswer').disabled = false;
  event.target.disabled = true;
}

function reset() {
  resetMoveables();
  question.answerElement = null;
  document.getElementById('newQuestion').disabled = false;
  document.getElementById('checkAnswer').disabled = true;
}

function resetMoveables() {
  for (let moveable of moveables.values()) {
    moveable.htmlElement.style.outline = 'none';
    moveable.htmlElement.style.position = '';
    moveable.htmlElement.style.left = 'initial';
    moveable.htmlElement.style.top = 'initial';
  }
}

function setRandomAnswer() {
  const randomIndex = Math.floor(Math.random() * moveables.size);
  question.answerElement = Array.from(moveables.values())[randomIndex].htmlElement;
  playMoveableAudio(question.answerElement);
}

function playMoveableAudio(moveableElement) {
  if (moveableElement !== null) {
    moveables.get(moveableElement.id).audioElement.play();
  }
}

// function playAudioFromEvent(event) {
//   playAudio(event.currentTarget.id);
// }

function playTargetAudio() {
  playMoveableAudio(question.answerElement)
}

// function newItem(event) {
//   const newItem = document.getElementById('feeder').children[0];
//   newItem.style.visibility = 'visible';
//   playAudio(newItem.id);
//   event.currentTarget.disabled = true;
// }

//#region Drag and Drop
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

//#endregion