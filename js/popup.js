'use strict';

const saveScheduleButton = document.getElementById('save-schedule-button');
const clearScheduleButton = document.getElementById('clear-schedule-button');
const scheduleNameInput = document.getElementById('schedule-name-input');
const schedulesList = document.getElementById('schedules-list');

/* Helper functions */
function removeElementById(id) {
  const element = document.getElementById(id);
  if (element) {
    element.parentNode.removeChild(element);
  }
}


/* HTML elements functions */
function createButtonSelectSchedule(name) {
  const button = document.createElement('button');
  button.onclick = function() {
    chrome.runtime.sendMessage({ type: 'selectSchedule', name });
  };
  button.appendChild(document.createTextNode(name));
  button.setAttribute('class', 'name-schedule');
  button.setAttribute('title', 'Cargar horario');

  return button;
}

function createButtonChangeScheduleName(name, currentScheduleItem) {
  const button = document.createElement('button');
  button.setAttribute('class', 'change-schedule-name image-button');
  button.setAttribute('title', 'Editar nombre');
  button.onclick = function() {
    const editScheduleItem = document.createElement('li');
    const nameInput = document.createElement('input');
    nameInput.setAttribute('value', name);
    nameInput.setAttribute('type', 'text');
    nameInput.setAttribute('placeholder', 'Nombre');
    nameInput.setAttribute('class', 'name-schedule');

    const saveButton = document.createElement('button');
    saveButton.setAttribute('class', 'save-schedule-name image-button');
    saveButton.setAttribute('title', 'Guardar');
    saveButton.onclick = function() {
      const newName = nameInput.value;
      if (!newName) {
        console.log('USER ERROR: no name provided');
        return;
      }

      chrome.runtime.sendMessage({
        type: 'changeScheduleName',
        oldName: name,
        newName: newName,
      }, function() {
        const newItem = createScheduleItem(newName);
        schedulesList.replaceChild(newItem, editScheduleItem);
      });
    };

    editScheduleItem.appendChild(nameInput);
    editScheduleItem.appendChild(saveButton);

    schedulesList.replaceChild(editScheduleItem, currentScheduleItem);
  };

  return button;
}

function createButtonUpdateSchedule(name) {
  const button = document.createElement('button');
  button.onclick = function() {
    chrome.runtime.sendMessage({ type: 'updateSchedule', name });
  };
  button.setAttribute('class', 'update-schedule image-button');
  button.setAttribute('title', 'Sobreescribir horario');

  return button;
}

function createButtonDeleteSchedule(name) {
  const button = document.createElement('button');
  button.onclick = function() {
    chrome.runtime.sendMessage({ type: 'deleteSchedule', name }, function() {
      deleteScheduleItem(name);
    });
  };
  button.setAttribute('class', 'delete-schedule image-button');
  button.setAttribute('title', 'Eliminar horario');

  return button;
}

function createScheduleItem(name) {
  const scheduleItem = document.createElement('li');

  const selectScheduleButton = createButtonSelectSchedule(name);
  const changeScheduleNameButton = createButtonChangeScheduleName(name, scheduleItem);
  const updateScheduleButton = createButtonUpdateSchedule(name);
  const deleteScheduleButton = createButtonDeleteSchedule(name);

  scheduleItem.appendChild(selectScheduleButton);
  scheduleItem.appendChild(changeScheduleNameButton);
  scheduleItem.appendChild(updateScheduleButton);
  scheduleItem.appendChild(deleteScheduleButton);

  scheduleItem.setAttribute('id', name);

  return scheduleItem;
}

function renderScheduleItem(name) {
  const item = createScheduleItem(name);
  schedulesList.appendChild(item);
}

function deleteScheduleItem(name) {
  removeElementById(name);
}

function renderSchedulesList(schedules) {
  schedules.forEach(schedule => renderScheduleItem(schedule.name));
}

function clearScheduleInput() {
  scheduleNameInput.value = '';
}


/* Subscribe events */
saveScheduleButton.onclick = function() {
  const name = scheduleNameInput.value;
  if (!name) {
    console.log('USER ERROR: no name provided');
    return;
  }
  chrome.runtime.sendMessage({ type: 'saveCurrentSchedule', name }, function() {
    renderScheduleItem(name);
    clearScheduleInput();
  });
}

clearScheduleButton.onclick = function() {
  chrome.runtime.sendMessage({ type: 'clearCurrentSchedule' });
}

scheduleNameInput.addEventListener('keyup', function(event) {
  if (event.key === 'Enter') {
    saveScheduleButton.click();
    event.preventDefault();
  }
});


/* Load schedules */
chrome.runtime.sendMessage({ type: 'loadSchedules' }, function(schedules) {
  renderSchedulesList(schedules);
});
