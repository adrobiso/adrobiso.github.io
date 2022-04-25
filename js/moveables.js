const moveables = new Map();
const correctAnswers = [];
let target;
let questionOrder;
let questionSelectionWeights;

Promise.all([
  fetch('data/words.json')
    .then(response => { return response.json(); }),
  fetch('data/categories.json')
    .then(response => { return response.json(); })
]).then(init);

function init(jsonData) {
  const moveablesBox = document.getElementById('moveablesBox');
  const category = new URLSearchParams(location.search).get('category');
  const categories = jsonData[1];

  if (categories.hasOwnProperty(category)) {
    createMoveables(jsonData[0], categories, category, moveablesBox);
    shuffleChildren(moveablesBox);
  } else {
    document.getElementById('newQuestion').disabled = true;
  }

  target = createTarget();

  document.getElementById('score').innerHTML = `0/${moveables.size}`;

  questionSelectionWeights = Array(moveables.size).fill().map((_, i) => (0.4 * ((moveables.size - 1 - i) / (moveables.size - 1))) + 1);

  questionOrder = Array.from(moveables.values()).map(moveable => { return { answer: moveable } });
  shuffle(questionOrder);
}

function createTarget(parentElement) {
  // const htmlElement = createTargetElement(parentElement);
  const htmlElement = document.getElementById('target1');
  return { htmlElement: htmlElement }
}

function createTargetElement(parentElement) {
  const targetElement = document.createElement('div');
  targetElement.classList.add('target');
  targetElement.onclick = playTargetAudio;
  parentElement.appendChild(targetElement);
  return targetElement;
}

function createMoveables(words, categories, category, parentElement) {
  if (!categories.hasOwnProperty(category)) { return; }

  for (let word of categories[category].words) {
    const newElement = createMoveable(word, words[word], parentElement);
    moveables.set(newElement.baseElement.id, newElement);
  }
}

function shuffleChildren(element) {
  const newOrder = shuffle(Array.from(Array(element.children.length).keys()))
  for (let i = 0; i < element.children.length; i++) {
    element.children[i].style.order = newOrder[i];
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createMoveable(id, data, parent) {
  const element = createMoveableElement(id, parent);
  // addLabelToMoveableElement(data.label, element);
  addImageToMoveableElement(data.imgSrc, element);
  const audio = addAudioToMoveableElement(data.audioSrc, element);

  return { baseElement: element, audioElement: audio };
}

function createMoveableElement(id, parent) {
  const element = document.createElement('div');
  element.id = id;
  element.classList.add('card');
  element.classList.add('moveable');
  element.onpointerdown = startDrag;
  element.onpointercancel = cancelDrag;
  parent.appendChild(element);
  return element;
}

function addLabelToMoveableElement(label, moveableElement) {
  const labelElement = document.createElement('p');
  labelElement.innerHTML = label;
  moveableElement.appendChild(labelElement);
  return labelElement;
}

function addAudioToMoveableElement(audioSrc, moveableElement) {
  const audioElement = document.createElement('audio');
  audioElement.src = audioSrc;
  audioElement.volume = 0.7;
  moveableElement.appendChild(audioElement);
  return audioElement;
}

function addImageToMoveableElement(imgSrc, moveableElement) {
  const imageElement = document.createElement('img');
  imageElement.src = imgSrc;
  moveableElement.appendChild(imageElement);
  return imageElement;
}

function checkAnswerEvent(event) {
  const isCorrect = checkAnswer(target);
  if (isCorrect) {
    document.getElementById('newQuestion').disabled = false;
    event.currentTarget.disabled = true;
  }

  const question = questionOrder[questionOrder.length - 1];
  if (!question.hasOwnProperty("wasCorrect")) {
    question.wasCorrect = isCorrect;
    if (isCorrect) {
      if (!correctAnswers.includes(question.answer)) {
        correctAnswers.push(question.answer);
      }
    } else {
      correctAnswers.length = 0;
    }
    const scoreElement = document.getElementById('score');
    scoreElement.innerHTML = `${correctAnswers.length}/${moveables.size}`;
  }
}

function checkAnswer(target) {
  const overlappingMoveables = [];
  for (let moveable of moveables.values()) {
    if (elementsAreOverlapping(moveable.baseElement, target.htmlElement)) {
      overlappingMoveables.push(moveable);
    }
  }
  if (overlappingMoveables.length === 1) {
    const moveable = overlappingMoveables[0];
    if (moveable.baseElement.id === target.answer.baseElement.id) {
      moveable.baseElement.style.outline = '2px dashed lightgreen';
      return true;
    } else {
      moveable.baseElement.style.outline = '2px dashed red';
      return false;
    }
  }
  else { return false; }
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

function setNewQuestion(event) {
  if (moveables.size === 0) { return; }

  resetMoveables();
  setRandomAnswer();
  shuffleChildren(document.getElementById('moveablesBox'));
  document.getElementById('checkAnswer').disabled = false;
  document.getElementById('target1').style.visibility = "visible";
  event.currentTarget.disabled = true;
}

function reset() {
  resetMoveables();
  target.answer = null;
  document.getElementById('newQuestion').disabled = false;
  document.getElementById('checkAnswer').disabled = true;
}

function resetMoveables() {
  for (let moveable of moveables.values()) {
    moveable.baseElement.style.outline = 'none';
    moveable.baseElement.style.position = '';
    moveable.baseElement.style.left = 'initial';
    moveable.baseElement.style.top = 'initial';
  }
}

function setRandomAnswer() {
  let maxValue = -1;
  let selectedIndex = 0;
  for (let i = 0; i < questionSelectionWeights.length; i++) {
    const value = questionSelectionWeights[i] * Math.random();
    if (value > maxValue) {
      selectedIndex = i;
      maxValue = value;
    }
  }

  const questionAnswerOrder = questionOrder.map(question => question.answer);
  target.answer = questionAnswerOrder[selectedIndex];
  target.answer.audioElement.play();

  if (questionAnswerOrder.includes(target.answer)) {
    const currentIndex = questionAnswerOrder.indexOf(target.answer);
    questionOrder.splice(currentIndex, 1);
  }
  questionOrder.push({ answer: target.answer });
}

function playMoveableAudio(moveable) {

}

function playTargetAudio() {
  target.answer.audioElement.play();
}

// function newItem(event) {
//   const newItem = document.getElementById('feeder').children[0];
//   newItem.style.visibility = 'visible';
//   playAudio(newItem.id);
//   event.currentTarget.disabled = true;
// }

// function toggleLock(event) {
//   const parent = event.target.parentElement;
//   if (parent.getAttribute('draggable') === 'true') {
//     parent.setAttribute('draggable', 'false');
//   } else {
//     parent.setAttribute('draggable', 'true');
//   }
// }

// function clearMoveables() {
//   for (let moveable of moveables.values()) {
//     moveable.htmlElement.remove();
//   }
//   moveables.clear();
// }