'use strict';

const saveScheduleButton = document.getElementById('save-schedule-button');
const clearScheduleButton = document.getElementById('clear-schedule-button');
const scheduleNameInput = document.getElementById('schedule-name-input');
const schedulesList = document.getElementById('schedules-list');
const schedulesListEmptyText = document.getElementById('schedules-list-empty-text');
const formErrorText = document.getElementById('form-error-text');


/* Helper functions */
function removeElementById(id) {
  const element = document.getElementById(id);
  if (element) {
    element.parentNode.removeChild(element);
  }
}

function subscribeEnter(element, callback) {
  element.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      callback();
      event.preventDefault();
    }
  });
}

function sendNotification(message) {
  chrome.notifications.create('notification', {
    type: 'basic',
    iconUrl: '../img/ok.png',
    title: 'BuscacursosUC',
    message,
  }, function(notificationId) {
    setTimeout(function() {
      chrome.notifications.clear(notificationId);
    }, 1500);
  });
}

function showFormError(message) {
  formErrorText.classList.remove('disabled');
  formErrorText.textContent = message;
}

function hideFormError() {
  formErrorText.classList.add('disabled');
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
      }, function(error) {
        if (error) return;
        const newItem = createScheduleItem(newName);
        schedulesList.replaceChild(newItem, editScheduleItem);
      });
    };
    subscribeEnter(nameInput, () => saveButton.click());

    editScheduleItem.appendChild(nameInput);
    editScheduleItem.appendChild(saveButton);

    schedulesList.replaceChild(editScheduleItem, currentScheduleItem);
  };

  return button;
}

function createButtonUpdateSchedule(name) {
  const button = document.createElement('button');
  button.onclick = function() {
    chrome.runtime.sendMessage({ type: 'updateSchedule', name }, function(error) {
      if (error) return; // TODO: change notification text??
      sendNotification(`'${name}' se sobrescribió con éxito`);
    });
  };
  button.setAttribute('class', 'update-schedule image-button');
  button.setAttribute('title', 'Sobreescribir horario');

  return button;
}

function createButtonDeleteSchedule(name) {
  const button = document.createElement('button');
  button.onclick = function() {
    chrome.runtime.sendMessage({ type: 'deleteSchedule', name }, function(error) {
      if (error) return;
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
  renderEmptyList(false);
}

function renderEmptyList(empty) {
  if (empty) {
    schedulesList.classList.add('disabled');
    schedulesListEmptyText.classList.remove('disabled');
  } else {
    schedulesList.classList.remove('disabled');
    schedulesListEmptyText.classList.add('disabled');
  }
}

function deleteScheduleItem(name) {
  removeElementById(name);
  renderEmptyList(schedulesList.childElementCount === 0);
}

function renderSchedulesList(schedules) {
  if (schedules.length === 0) {
    renderEmptyList(true);
  } else {
    renderEmptyList(false);
    schedules.forEach(schedule => renderScheduleItem(schedule.name));
  }
}

function clearScheduleInput() {
  scheduleNameInput.value = '';
}


/* Subscribe events */
saveScheduleButton.onclick = function() {
  const name = scheduleNameInput.value;
  if (!name) {
    console.log('USER ERROR: no name provided');
    showFormError('Provee un nombre');
    return;
  }
  chrome.runtime.sendMessage({ type: 'saveCurrentSchedule', name }, function(error) {
    if (error === 1) {
      showFormError('Horario vacío!');
      return;
    } else if (error === 2) {
      showFormError('Nombre ocupado!');
      return;
    }
    hideFormError();
    renderScheduleItem(name);
    clearScheduleInput();
  });
}

clearScheduleButton.onclick = function() {
  hideFormError();
  chrome.runtime.sendMessage({ type: 'clearCurrentSchedule' });
}

subscribeEnter(scheduleNameInput, () => saveScheduleButton.click());


/* Load schedules */
chrome.runtime.sendMessage({ type: 'loadSchedules' }, function(schedules) {
  renderSchedulesList(schedules);
});
