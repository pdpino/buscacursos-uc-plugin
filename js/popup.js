'use strict';

const saveScheduleButton = document.getElementById('save-schedule-button');
const clearScheduleButton = document.getElementById('clear-schedule-button');
const scheduleNameInput = document.getElementById('schedule-name-input');
const schedulesList = document.getElementById('schedules-list');

function removeElementById(id) {
  const element = document.getElementById(id);
  if (element) {
    element.parentNode.removeChild(element);
  }
}

function deleteScheduleItem(name) {
  removeElementById(name);
}

function renderScheduleItem(name) {
  const scheduleItem = document.createElement('li');

  const selectScheduleButton = document.createElement('button');
  selectScheduleButton.onclick = function() {
    chrome.runtime.sendMessage({ type: 'selectSchedule', name });
  };
  selectScheduleButton.appendChild(document.createTextNode(name));
  selectScheduleButton.setAttribute('class', 'name-schedule');
  selectScheduleButton.setAttribute('title', 'Cargar horario');

  const updateScheduleButton = document.createElement('button');
  updateScheduleButton.onclick = function() {
    chrome.runtime.sendMessage({ type: 'updateSchedule', name });
  };
  updateScheduleButton.setAttribute('class', 'update-schedule image-button');
  updateScheduleButton.setAttribute('title', 'Sobreescribir horario');

  const deleteScheduleButton = document.createElement('button');
  deleteScheduleButton.onclick = function() {
    chrome.runtime.sendMessage({ type: 'deleteSchedule', name }, function() {
      deleteScheduleItem(name);
    });
  };
  deleteScheduleButton.setAttribute('class', 'delete-schedule image-button');
  deleteScheduleButton.setAttribute('title', 'Eliminar horario');

  scheduleItem.appendChild(selectScheduleButton);
  scheduleItem.appendChild(updateScheduleButton);
  scheduleItem.appendChild(deleteScheduleButton);

  scheduleItem.setAttribute('id', name);
  schedulesList.appendChild(scheduleItem);
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
    // TODO: show error
    console.log('NO NAME PROVIDED');
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
