(function () {
  const ui = {};
  const correctAnswers = [];
  const currentQuestion = {};
  const questionOptions = { playAudio: true, showImage: false, showLabel: false };
  let questionOrder;
  let questionSelectionWeights;

  //TODO: non-static server so we can request only the words we need instead of
  //      the whole DB (and rejoin words and categories into same DB, which is 
  //      currently seperated so the category select page doesn't have to load 
  //      the words)
  Promise.all([
    fetch('data/words.json')
      .then(response => { return response.json(); }),
    fetch('data/categories.json')
      .then(response => { return response.json(); })
  ]).then(init);

  function init(jsonData) {
    const category = new URLSearchParams(location.search).get('category');
    const wordDataDB = jsonData[0];
    const categoriesDB = jsonData[1];

    //TODO: fails if no such category
    const words = categoriesDB[category].words;
    const wordData = words.reduce((prev, curr) => (prev[curr] = wordDataDB[curr], prev), {});

    initUI(wordData);

    questionSelectionWeights = Array(words.length).fill().map((_, i) => (0.4 * ((words.length - 1 - i) / (words.length - 1))) + 1);

    questionOrder = words.map(word => { return { answer: word } });
    shuffle(questionOrder);
  }

  function initUI(wordData) {
    ui.moveablesBox = document.getElementById('moveablesBox');
    ui.targetBox = document.getElementById('targetBox');
    ui.newQuestionButton = document.getElementById('newQuestion');
    ui.checkAnswerButton = document.getElementById('checkAnswer');
    ui.scoreLabel = document.getElementById('score');
    ui.questionAudioCheckbox = document.getElementById('questionAudioCheckbox');
    ui.questionImageCheckbox = document.getElementById('questionImageCheckbox');
    ui.questionLabelCheckbox = document.getElementById('questionLabelCheckbox');
    ui.moveables = new Map();

    ui.questionAudioCheckbox.checked = questionOptions.playAudio;
    ui.questionImageCheckbox.checked = questionOptions.showImage;
    ui.questionLabelCheckbox.checked = questionOptions.showLabel;

    ui.newQuestionButton.onclick = setNewQuestion;
    ui.checkAnswerButton.onclick = checkAnswerEvent;
    ui.questionAudioCheckbox.onchange = setQuestionAudio;
    ui.questionImageCheckbox.onchange = setQuestionImage;
    ui.questionLabelCheckbox.onchange = setQuestionLabel;

    //TODO: link moveables to backend structures?
    createMoveables(wordData, ui.moveablesBox);
    for (let moveableElement of ui.moveables.values()) {
      moveableElement.labelElement.style.display = 'none';
    }
    shuffleChildren(ui.moveablesBox);

    createTarget(ui.targetBox);
    addAudioIndicatorToTarget();

    ui.scoreLabel.innerHTML = `0/${ui.moveables.size}`;
  }

  function createTarget(parentElement) {
    ui.target = createTargetElement(parentElement);;
    return { htmlElement: ui.target };
  }

  function createTargetElement(parentElement) {
    const targetElement = document.createElement('div');
    targetElement.classList.add('target');
    targetElement.onclick = playTargetAudio;
    parentElement.appendChild(targetElement);
    return targetElement;
  }

  function setQuestionLabel(event) {
    showQuestionLabel(event.currentTarget.checked);
  }

  function showQuestionLabel(show) {
    questionOptions.showLabel = show;
    if (show) { addLabelToTarget(); }
    else { removeLabelFromTarget(); }
  }

  function addLabelToTarget() {
    ui.targetLabel = createLabelElement(ui.moveables.get(currentQuestion.answer).labelElement.innerHTML, ui.target);
  }

  function removeLabelFromTarget() {
    ui.targetLabel.remove();
    delete ui.targetLabel;
  }

  function setQuestionImage(event) {
    showQuestionImage(event.currentTarget.checked);
  }

  function showQuestionImage(show) {
    questionOptions.showImage = show;
    if (show) { addImageToTarget(); }
    else { removeImageFromTarget(); }
  }

  function addImageToTarget() {
    const answerImageElement = ui.moveables.get(currentQuestion.answer).imageElement;
    const targetImageElement = createImageElement(answerImageElement.src, answerImageElement.altText, ui.target);
    targetImageElement.classList.add('targetImage');
    ui.targetImage = targetImageElement;
  }

  function removeImageFromTarget() {
    ui.targetImage.remove();
    delete ui.targetImage;
  }

  function setQuestionAudio(event) {
    playQuestionAudio(event.currentTarget.checked);
  }

  function playQuestionAudio(play) {
    questionOptions.playAudio = play;
    if (play) { addAudioIndicatorToTarget(); }
    else { removeAudioIndicatorFromTarget(); }
  }

  function addAudioIndicatorToTarget() {
    const speakerImageElement = createImageElement('./media/img/speaker.png', 'play target audio', ui.target);
    speakerImageElement.classList.add('audioIndicator');
    ui.target.onclick = playTargetAudio;
    ui.targetAudioImage = speakerImageElement;
  }

  function removeAudioIndicatorFromTarget() {
    ui.targetAudioImage.remove();
    delete ui.targetAudioImage;
    ui.target.onclick = null;
  }

  function createMoveables(wordData, parentElement) {
    for (let word of Object.keys(wordData)) {
      const newElement = createMoveable(word, wordData[word], parentElement);
      ui.moveables.set(word, newElement);
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
    const label = createLabelElement(data.label, element);
    const image = createImageElement(data.imgSrc, data.label + ' image', element);
    const audio = createAudioElement(data.audioSrc, element);

    return { baseElement: element, labelElement: label, imageElement: image, audioElement: audio };
  }

  function createMoveableElement(id, parent) {
    const element = document.createElement('div');
    element.id = id;
    element.classList.add('card');
    element.classList.add('moveable');
    element.onpointerdown = startDrag;
    element.onpointercancel = cancelDrag;
    parent?.appendChild(element);
    return element;
  }

  function createLabelElement(label, parent) {
    const labelElement = document.createElement('p');
    labelElement.innerHTML = label;
    parent?.appendChild(labelElement);
    return labelElement;
  }

  function createAudioElement(audioSrc, parent) {
    const audioElement = document.createElement('audio');
    audioElement.src = audioSrc;
    audioElement.volume = 0.7;
    parent?.appendChild(audioElement);
    return audioElement;
  }

  function createImageElement(imgSrc, altText, parent) {
    const imageElement = document.createElement('img');
    imageElement.src = imgSrc;
    imageElement.alt = altText;
    parent?.appendChild(imageElement);
    return imageElement;
  }

  function checkAnswerEvent(event) {
    const isCorrect = checkAnswer();
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
      ui.scoreLabel.innerHTML = `${correctAnswers.length}/${ui.moveables.size}`;
    }
  }

  function checkAnswer() {
    const overlappingMoveables = [];
    for (let moveable of ui.moveables.values()) {
      if (elementsAreOverlapping(moveable.baseElement, ui.target)) {
        overlappingMoveables.push(moveable);
      }
    }
    if (overlappingMoveables.length === 1) {
      const moveable = overlappingMoveables[0];
      if (moveable.baseElement.id === currentQuestion.answer) {
        moveable.baseElement.style.outline = '2px dashed lightgreen';
        return true;
      } else {
        moveable.baseElement.style.outline = '2px dashed red';
        return false;
      }
    }
    else { return false; }
  }

  function setNewQuestion() {
    if (ui.moveables.size === 0) { return; }

    resetMoveables();
    setRandomAnswer();
    shuffleChildren(ui.moveablesBox);
    ui.checkAnswerButton.disabled = false;
    ui.target.style.visibility = "visible";
    ui.newQuestionButton.disabled = true;
  }

  function reset() {
    resetMoveables();
    currentQuestion.answer = null;
    ui.newQuestionButton.disabled = false;
    ui.checkAnswerButton.disabled = true;
  }

  function resetMoveables() {
    for (let moveable of ui.moveables.values()) {
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
    currentQuestion.answer = questionAnswerOrder[selectedIndex];

    if (questionOptions.playAudio) {
      ui.moveables.get(currentQuestion.answer).audioElement.play();
    }
    if (questionOptions.showImage) {
      ui.targetImage.src = ui.moveables.get(currentQuestion.answer).imageElement.src;
      ui.targetImage.altText = ui.moveables.get(currentQuestion.answer).imageElement.altText;
    }
    if (questionOptions.showLabel) {
      ui.targetLabel.innerHTML = ui.moveables.get(currentQuestion.answer).labelElement.innerHTML;
    }

    if (questionAnswerOrder.includes(currentQuestion.answer)) {
      const currentIndex = questionAnswerOrder.indexOf(currentQuestion.answer);
      questionOrder.splice(currentIndex, 1);
    }
    questionOrder.push({ answer: currentQuestion.answer });
  }

  function playTargetAudio() {
    ui.moveables.get(currentQuestion.answer).audioElement.play();
  }
})();