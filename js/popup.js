'use strict';

// UTILS
function reloadPage() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
  });
}


// COOKIES API
const currentSemester = '2018-2';
const url = 'http://buscacursos.uc.cl';
const currentCookieName = `cursosuc-${currentSemester}`;
const currentCookieDetail = { url, name: currentCookieName };

function removeCurrentCookie(callback) {
  chrome.cookies.remove(currentCookieDetail, callback);
}

function getCurrentCookie(callback) {
  chrome.cookies.get(currentCookieDetail, callback);
}

function saveCurrentCookie(value, callback) {
  chrome.cookies.set({
    ...currentCookieDetail,
    value,
  }, callback);
}


// SCHEDULE ACTIONS
function deleteSchedule(name, itemDeRenderer) {
  chrome.storage.sync.get(['schedules'], function(result) {
    const { schedules } = result;
    if (!schedules) {
      // TODO: handle internal error
      console.log('NO SCHEDULES FOUND');
      return;
    }
    chrome.storage.sync.set({
      schedules: schedules.filter(sch => sch.name !== name),
    }, () => itemDeRenderer(name));
  });
}

function selectSchedule(name) {
  chrome.storage.sync.get(['schedules'], function(result) {
    const { schedules } = result;
    const schedule = schedules && schedules.find(sch => sch.name === name);
    if (!schedule) {
      // TODO: handle internal error
      console.log('NO SCHEDULE FOUND');
      return;
    }
    saveCurrentCookie(schedule.value, () => reloadPage());
  });
}

function saveCurrentSchedule(name, itemRenderer) {
  getCurrentCookie((cookie) => {
    if (!cookie || !cookie.value) {
      // TODO: show error: 'no classes added to schedule'
      console.log('NO SCHEDULE FOUND (TO SAVE)');
      return;
    }

    chrome.storage.sync.get(['schedules'], function(result) {
      const schedules = result.schedules || [];
      if (schedules.find(schedule => schedule.name === name)) {
        // TODO show error
        console.log('NAME ALREADY TAKEN');
        return;
      }
      schedules.push({ name, value: cookie.value });
      chrome.storage.sync.set({ schedules }, () => itemRenderer(name));
    });
  });
}

function clearCurrentSchedule() {
  removeCurrentCookie(() => reloadPage());
}

function loadSchedulesList(listRenderer) {
  chrome.storage.sync.get(['schedules'], function(result) {
    const schedules = result.schedules || [];
    listRenderer(schedules);
  });
}


// HTML ELEMENTS
const saveScheduleButton = document.getElementById('save-schedule-button');
const clearScheduleButton = document.getElementById('clear-schedule-button');
const saveScheduleText = document.getElementById('save-schedule-text');
const schedulesList = document.getElementById('schedules-list');

// RENDERER FUNCTIONS
function deRenderScheduleItem(name) {
  removeElementById(name);
}

function renderScheduleItem(name) {
  const scheduleItem = document.createElement('li');

  const selectScheduleButton = document.createElement('button');
  selectScheduleButton.onclick = () => selectSchedule(name);
  selectScheduleButton.appendChild(document.createTextNode(name));
  selectScheduleButton.setAttribute('class', 'name-schedule');
  selectScheduleButton.setAttribute('title', 'Cargar horario');

  const deleteScheduleButton = document.createElement('button');
  deleteScheduleButton.onclick = () => deleteSchedule(name, deRenderScheduleItem);
  deleteScheduleButton.setAttribute('class', 'delete-schedule');
  deleteScheduleButton.setAttribute('title', 'Eliminar horario');

  scheduleItem.appendChild(selectScheduleButton);
  scheduleItem.appendChild(deleteScheduleButton);

  scheduleItem.setAttribute('id', name);
  schedulesList.appendChild(scheduleItem);
}

function renderSchedulesList(schedules) {
  schedules.forEach(schedule => renderScheduleItem(schedule.name));
}

function removeElementById(id) {
  const element = document.getElementById(id);
  if (!element) return;

  element.parentNode.removeChild(element);
}


// START POPUP
saveScheduleButton.onclick = () => {
  const name = saveScheduleText.value;
  if (!name) {
    // TODO: show error
    console.log('NO NAME PROVIDED');
    return;
  }
  saveCurrentSchedule(name, renderScheduleItem);
}

clearScheduleButton.onclick = () => clearCurrentSchedule();

saveScheduleText.addEventListener('keyup', event => {
  if (event.key !== 'Enter') return;
  saveScheduleButton.click();
  event.preventDefault();
});

loadSchedulesList(renderSchedulesList);
