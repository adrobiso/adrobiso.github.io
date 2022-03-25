function drag_start(event) {
   setTimeout(function () {
      event.target.style.visibility = "hidden";
   }, 1);
   const style = window.getComputedStyle(event.target, null);
   event.dataTransfer.setData("text/plain",
      event.target.id + ',' + (parseInt(style.getPropertyValue("left"), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"), 10) - event.clientY));
}

function drag_over(event) {
   event.preventDefault();
}

function drop(event) {
   const data = event.dataTransfer.getData("text/plain").split(',');
   const offset = data.slice(1);
   const draggedElement = document.getElementById(data[0]);
   setTimeout(function () {
      draggedElement.style.visibility = "visible";
   }, 1);
   draggedElement.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
   draggedElement.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
   event.preventDefault();
   return draggedElement;
}

function reparentOnDrop(event) {
   const draggedElement = drop(event);
   event.currentTarget.appendChild(draggedElement);
   setTimeout(function () {
      draggedElement.style.left = "0px";
      draggedElement.style.top = "0px";
   }, 1);
}

function check_answer(event) {
   const targets = document.getElementsByClassName("target");
   const moveables = document.getElementsByClassName("moveable");
   for (let target of targets) {
      let targetAudio = document.getElementById(target.id + "Audio");
      let answerId = targetAudio.src.slice(targetAudio.src.lastIndexOf('/') + 1, -4);
      let answerMoveable = document.getElementById(answerId);
      for (let moveable of moveables) {
         if (isObjOnObj(moveable, target)) {
            if (moveable == answerMoveable) {
               moveable.style.outline = "2px dashed lightgreen";
               document.getElementById("newQuestion").disabled = false;
               event.target.disabled = true;
            } else {
               moveable.style.outline = "2px dashed red";
            }
         }
         else {
            moveable.style.outline = "none";
         }
      }
   }
}

function toggle_lock(event) {
   const parent = event.target.parentElement;
   if (parent.getAttribute('draggable') == "true") {
      parent.setAttribute('draggable', "false");
   } else {
      parent.setAttribute('draggable', "true");
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
   const moveables = document.getElementsByClassName("moveable");
   for (let moveable of moveables) {
      moveable.style.outline = "none";
      moveable.style.position = "";
      moveable.style.left = "initial";
      moveable.style.top = "initial";
   }
   setRandomTargets();
   document.getElementById("checkAnswer").disabled = false;
   event.target.disabled = true;
}

function setRandomTargets() {
   const targets = document.getElementsByClassName("target");
   const moveables = document.getElementsByClassName("moveable");

   for (let target of targets) {
      let index = Math.floor(Math.random() * moveables.length);

      let targetAudio = document.getElementById(target.id + "Audio");
      targetAudio.src = "media/audio/" + moveables[index].id + ".mp3";
      targetAudio.play();
   }
}

function play_audio(element) {
   document.getElementById(element.id + "Audio").play();
}

function audioFromEvent(event) {
   play_audio(event.currentTarget);
}

function new_item() {
   const feeders = document.getElementsByClassName("feeder");
   for (let feeder of feeders) {
      feeder.children[0].style.visibility = "visible";
      play_audio(feeder.children[0]);
   }
}