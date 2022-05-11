(function () {
  const ui = {};
  const correctAnswers = [];
  const currentQuestion = {};
  const questionOptions = { playsAudio: true, showsImage: false, showsLabel: false };
  const answerOptions = { playsAudio: false, showsImage: true, showsLabel: false };
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
    ui.showOptionsButton = document.getElementById('showOptions');
    ui.optionsDiv = document.getElementById('forms');
    ui.questionAudioCheckbox = document.getElementById('questionAudioCheckbox');
    ui.questionImageCheckbox = document.getElementById('questionImageCheckbox');
    ui.questionLabelCheckbox = document.getElementById('questionLabelCheckbox');
    ui.answerAudioCheckbox = document.getElementById('answerAudioCheckbox');
    ui.answerImageCheckbox = document.getElementById('answerImageCheckbox');
    ui.answerLabelCheckbox = document.getElementById('answerLabelCheckbox');
    ui.moveables = new Map();

    ui.questionAudioCheckbox.checked = questionOptions.playsAudio;
    ui.questionImageCheckbox.checked = questionOptions.showsImage;
    ui.questionLabelCheckbox.checked = questionOptions.showsLabel;
    ui.answerAudioCheckbox.checked = answerOptions.playsAudio;
    ui.answerImageCheckbox.checked = answerOptions.showsImage;
    ui.answerLabelCheckbox.checked = answerOptions.showsLabel;

    ui.newQuestionButton.onclick = setNewQuestion;
    ui.checkAnswerButton.onclick = checkAnswerEvent;
    ui.showOptionsButton.onclick = handleShowOptionsToggle;
    ui.questionAudioCheckbox.onchange = handleQuestionAudioToggle;
    ui.questionImageCheckbox.onchange = handleQuestionImageToggle;
    ui.questionLabelCheckbox.onchange = handleQuestionLabelToggle;
    ui.answerAudioCheckbox.onchange = handleAnswerAudioToggle;
    ui.answerImageCheckbox.onchange = handleAnswerImageToggle;
    ui.answerLabelCheckbox.onchange = handleAnswerLabelToggle;

    createMoveables(wordData, ui.moveablesBox);
    shuffleChildren(ui.moveablesBox);

    createTarget(ui.targetBox);

    ui.scoreLabel.innerHTML = `0/${ui.moveables.size}`;
  }

  function createTarget(parentElement) {
    ui.target = {};
    ui.target.htmlElement = createTargetElement(parentElement);
    ui.target.audioIndicatorElement = createImageElement('./media/img/speaker.png', 'play question audio', ui.target.htmlElement);
    ui.target.audioIndicatorElement.classList.add('audioIndicator');
    ui.target.audioIndicatorElement.style.display = questionOptions.playsAudio ? '' : 'none';
    ui.target.htmlElement.onclick = questionOptions.playsAudio ? playTargetAudio : null;
    ui.target.imageElement = createImageElement('', 'no question', ui.target.htmlElement);
    ui.target.imageElement.classList.add('cardImg');
    ui.target.imageElement.style.display = questionOptions.showsImage ? '' : 'none';
    ui.target.labelElement = createLabelElement('no question', ui.target.htmlElement);
    ui.target.labelElement.style.display = questionOptions.showsLabel ? '' : 'none';
  }

  function createTargetElement(parentElement) {
    const targetElement = document.createElement('div');
    targetElement.classList.add('card');
    targetElement.classList.add('target');
    targetElement.onclick = playTargetAudio;
    parentElement.appendChild(targetElement);
    return targetElement;
  }

  function handleShowOptionsToggle() {
    ui.optionsDiv.style.display = ui.optionsDiv.style.display === '' ? 'block' : '';
  }

  function handleQuestionLabelToggle(event) {
    setQuestionShowsLabel(event.currentTarget.checked);
  }

  function setQuestionShowsLabel(showsLabel) {
    questionOptions.showsLabel = showsLabel;
    ui.target.labelElement.style.display = showsLabel ? '' : 'none';
    reset();
  }

  function handleQuestionImageToggle(event) {
    setQuestionShowsImage(event.currentTarget.checked);
  }

  function setQuestionShowsImage(showsImage) {
    questionOptions.showsImage = showsImage;
    ui.target.imageElement.style.display = showsImage ? '' : 'none';
    reset();
  }

  function handleQuestionAudioToggle(event) {
    setQuestionPlaysAudio(event.currentTarget.checked);
  }

  function setQuestionPlaysAudio(playsAudio) {
    questionOptions.playsAudio = playsAudio;
    ui.target.audioIndicatorElement.style.display = playsAudio ? '' : 'none';
    ui.target.htmlElement.onclick = playsAudio ? playTargetAudio : null;
    reset();
  }

  function handleAnswerLabelToggle(event) {
    answerOptions.showsLabel = event.currentTarget.checked;
    for (let moveable of ui.moveables.values()) {
      moveable.labelElement.style.display = answerOptions.showsLabel ? '' : 'none';
    }
    reset();
  }

  function handleAnswerImageToggle(event) {
    answerOptions.showsImage = event.currentTarget.checked;
    for (let moveable of ui.moveables.values()) {
      moveable.imageElement.style.display = answerOptions.showsImage ? '' : 'none';
    }
    reset();
  }

  function handleAnswerAudioToggle(event) {
    answerOptions.playsAudio = event.currentTarget.checked;
    for (let moveable of ui.moveables.values()) {
      moveable.audioIndicator.style.display = answerOptions.playsAudio ? '' : 'none';
      moveable.baseElement.onclick = answerOptions.playsAudio ? handlePlayMoveableAudio : null;
    }
    reset();
  }

  function createMoveables(wordData, parentElement) {
    for (let word of Object.keys(wordData)) {
      const moveable = createMoveable(word, wordData[word], parentElement);
      moveable.labelElement.style.display = answerOptions.showsLabel ? '' : 'none';
      moveable.audioIndicator.style.display = answerOptions.playsAudio ? '' : 'none';
      moveable.baseElement.onclick = answerOptions.playsAudio ? handlePlayMoveableAudio : null;
      ui.moveables.set(word, moveable);
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
    const image = createImageElement(data.imgSrc, data.label + ' image', element);
    image.classList.add('cardImg');
    const label = createLabelElement(data.label, element);
    const audio = createAudioElement(data.audioSrc, element);
    const audioIndicator = createImageElement('./media/img/speaker.png', 'play question audio', element);
    audioIndicator.classList.add('audioIndicator');

    return { baseElement: element, labelElement: label, imageElement: image, audioElement: audio, audioIndicator: audioIndicator };
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
      updateScoreText();
    }
  }

  function updateScoreText() {
    ui.scoreLabel.innerHTML = `${correctAnswers.length}/${ui.moveables.size}`;
    ui.scoreLabel.style.color = correctAnswers.length === ui.moveables.size ? 'lightgreen' : 'white';
  }

  function checkAnswer() {
    const overlappingMoveables = [];
    for (let moveable of ui.moveables.values()) {
      if (elementsAreOverlapping(moveable.baseElement, ui.target.htmlElement)) {
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
    ui.target.htmlElement.style.visibility = "visible";
    ui.newQuestionButton.disabled = true;
  }

  function reset() {
    setNewQuestion();
    ui.scoreLabel.style.color = 'white';
    correctAnswers.length = 0;
    updateScoreText();
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

    const answerMoveable = ui.moveables.get(currentQuestion.answer);
    if (questionOptions.playsAudio) {
      answerMoveable.audioElement.play();
    }
    ui.target.imageElement.src = answerMoveable.imageElement.src;
    ui.target.imageElement.altText = answerMoveable.imageElement.altText;
    ui.target.labelElement.innerHTML = answerMoveable.labelElement.innerHTML;

    if (questionAnswerOrder.includes(currentQuestion.answer)) {
      const currentIndex = questionAnswerOrder.indexOf(currentQuestion.answer);
      questionOrder.splice(currentIndex, 1);
    }
    questionOrder.push({ answer: currentQuestion.answer });
  }

  function playTargetAudio() {
    ui.moveables.get(currentQuestion.answer).audioElement.play();
  }

  function handlePlayMoveableAudio(event) {
    ui.moveables.get(event.currentTarget.id).audioElement.play();
  }
})();