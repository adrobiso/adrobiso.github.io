const moveables = new Map();
const questionElement = { htmlElement: null, answerElement: null };
const correctAnswers = [];
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

  questionElement.htmlElement = document.getElementById('target1');

  document.getElementById('score').innerHTML = `0/${moveables.size}`;

  questionSelectionWeights = Array(moveables.size).fill().map((_, i) => (0.4 * ((moveables.size - 1 - i) / (moveables.size - 1))) + 1);

  questionOrder = Array.from(moveables.values()).map((moveable) => ({ answer: moveable.htmlElement }));
  shuffle(questionOrder);
}

function createMoveables(words, categories, category, parentElement) {
  if (!categories.hasOwnProperty(category)) { return; }

  for (let word of categories[category].words) {
    const newElement = createMoveableElement(words[word], parentElement);
    moveables.set(newElement.htmlElement.id, newElement);
  }
}

function shuffleChildren(element) {
  const newOrder = shuffle(Array.from(Array(element.children.length).keys()))
  for (let i = 0; i < element.children.length; i++) {
    element.children[i].style.order = newOrder[i];
  }
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createMoveableElement(data, parent) {
  const element = document.createElement('div');
  element.id = data.label;
  element.classList.add('card');
  element.classList.add('moveable');
  element.onpointerdown = startDrag;
  element.onpointercancel = cancelDrag;
  const image = document.createElement('img');
  image.src = data.imgSrc;
  element.appendChild(image);
  const audio = document.createElement('audio');
  audio.id = data.label + 'Audio';
  audio.src = data.audioSrc;
  audio.volume = 0.5;
  element.appendChild(audio);
  const label = document.createElement('p');
  label.innerHTML = data.label;
  label.style.display = "none";
  element.appendChild(label);
  parent.appendChild(element);

  return { htmlElement: element, audioElement: audio, data: data };
}

function checkAnswerEvent(event) {
  const isCorrect = checkAnswer(questionElement);
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

function checkAnswer(questionElement) {
  const overlappingMoveables = [];
  for (let moveable of moveables.values()) {
    if (elementsAreOverlapping(moveable.htmlElement, questionElement.htmlElement)) {
      overlappingMoveables.push(moveable);
    }
  }
  if (overlappingMoveables.length === 1) {
    const moveable = overlappingMoveables[0];
    if (moveable.htmlElement.id === questionElement.answerElement.id) {
      moveable.htmlElement.style.outline = '2px dashed lightgreen';
      return true;
    } else {
      moveable.htmlElement.style.outline = '2px dashed red';
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
  questionElement.answerElement = null;
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
  questionElement.answerElement = questionAnswerOrder[selectedIndex];
  playMoveableAudio(questionElement.answerElement);

  if (questionAnswerOrder.includes(questionElement.answerElement)) {
    const currentIndex = questionAnswerOrder.indexOf(questionElement.answerElement);
    questionOrder.splice(currentIndex, 1);
  }
  questionOrder.push({ answer: questionElement.answerElement });
}

function playMoveableAudio(moveableElement) {
  if (moveableElement !== null) {
    moveables.get(moveableElement.id).audioElement.play();
  }
}

function playTargetAudio() {
  playMoveableAudio(questionElement.answerElement)
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