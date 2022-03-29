let moveables;

window.onload = init;

function init() {
   let red = {label:'red', audioElement:document.getElementById('redAudio')};
   let blue = {label:'blue', audioElement:document.getElementById('blueAudio')};
   moveables = new Map([[blue.label, blue],[red.label, red]]);
}

function drag_start(event) {
   setTimeout(function () {
      event.target.style.visibility = 'hidden';
   }, 1);
   const style = window.getComputedStyle(event.target, null);
   event.dataTransfer.setData('text/plain',
      event.target.id + ',' + (parseInt(style.getPropertyValue('left'), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue('top'), 10) - event.clientY));
}

function drag_over(event) {
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

function reparent_on_drop(event) {
   const draggedElement = drop(event);
   event.currentTarget.appendChild(draggedElement);
   setTimeout(function () {
      draggedElement.style.left = '0px';
      draggedElement.style.top = '0px';
   }, 1);
}

function recepticle_on_drop(event) {
   reparent_on_drop(event);
   const newItemButton = document.getElementById("newItem");
   const feeder = document.getElementById("feeder");
   if (feeder.children.length > 0) {
      newItemButton.disabled = false;
   }
}

function check_answer_event(event) {
   const target = document.getElementById('target1');
   if (check_answer(target)) {
      event.currentTarget.disabled = true;
   }
}

function check_answer(targetElement) {
   let isCorrect = false;
   const moveableElements = document.getElementsByClassName('moveable');
   for (let moveableElement of moveableElements) {
      if (isObjOnObj(moveableElement, targetElement)) {
         if (moveableElement.id == targetElement.dataset.targetMoveable) {
            moveableElement.style.outline = '2px dashed lightgreen';
            document.getElementById('newQuestion').disabled = false;
            isCorrect = true;
         } else { moveableElement.style.outline = '2px dashed red'; }
      }
      else { moveableElement.style.outline = 'none'; }
   }
   return isCorrect;
}

function toggle_lock(event) {
   const parent = event.target.parentElement;
   if (parent.getAttribute('draggable') == 'true') {
      parent.setAttribute('draggable', 'false');
   } else {
      parent.setAttribute('draggable', 'true');
   }
}

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

function new_question(event) {
   const moveableElements = document.getElementsByClassName('moveable');
   for (let moveableElement of moveableElements) {
      moveableElement.style.outline = 'none';
      moveableElement.style.position = '';
      moveableElement.style.left = 'initial';
      moveableElement.style.top = 'initial';
   }
   setRandomTargets();
   document.getElementById('checkAnswer').disabled = false;
   event.target.disabled = true;
}

function setRandomTargets() {
   const targets = document.getElementsByClassName('target');
   const moveableElements = document.getElementsByClassName('moveable');

   for (let target of targets) {
      let index = Math.floor(Math.random() * moveableElements.length);
      let moveableElement = moveableElements[index];
      target.dataset.targetMoveable = moveableElement.id;
      play_audio(moveableElement.id);
   }
}

function play_audio(moveableId) {
   moveables.get(moveableId).audioElement.play();
}

function play_audio_from_event(event) {
   play_audio(event.currentTarget.id);
}

function play_target_audio_from_event(event) {
   play_audio(event.currentTarget.dataset.targetMoveable)
}

function new_item(event) {
   const newItem = document.getElementById('feeder').children[0];
   newItem.style.visibility = 'visible';
   play_audio(newItem.id);
   event.currentTarget.disabled = true;
}