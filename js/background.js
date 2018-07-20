'use strict';

chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostEquals: 'buscacursos.uc.cl' },
        }),
      ],
      actions: [
        new chrome.declarativeContent.ShowPageAction(),
      ],
    }]);
  });
});

function reloadPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
  });
}

/* Cookie wrappers */
const currentSemester = '2018-2';
const currentCookieDetail = {
  url: 'http://buscacursos.uc.cl',
  name: `cursosuc-${currentSemester}`,
};

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


/* Schedules actions */
function deleteSchedule(name, callback) {
  loadSchedules(function(schedules) {
    chrome.storage.sync.set({
      schedules: schedules.filter(sch => sch.name !== name),
    }, callback);
  });
}

function selectSchedule(name) {
  loadSchedules(function(schedules) {
    const schedule = schedules.find(sch => sch.name === name);
    if (!schedule) {
      // TODO: handle internal error
      console.log('INTERNAL ERROR: no schedule found with', name);
      return;
    }
    saveCurrentCookie(schedule.value, reloadPage);
  });
}

function saveCurrentSchedule(name, callback) {
  getCurrentCookie(function(cookie) {
    if (!cookie || !cookie.value) {
      // TODO: show error
      console.log('NO CLASSES ADDED TO SCHEDULE');
      return;
    }

    loadSchedules(function(schedules) {
      if (schedules.find(sch => sch.name === name)) {
        // TODO show error
        console.log('NAME ALREADY TAKEN');
        return;
      }
      schedules.push({ name, value: cookie.value });
      chrome.storage.sync.set({ schedules }, callback);
    });
  });
}

function clearCurrentSchedule() {
  removeCurrentCookie(reloadPage);
}

function loadSchedules(callback) {
  chrome.storage.sync.get(['schedules'], function(result) {
    callback(result.schedules || []);
  });
}

/* Subscribe messages */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.type) {
      case 'deleteSchedule':
        deleteSchedule(request.name, sendResponse);
        break;
      case 'selectSchedule':
        selectSchedule(request.name);
        break;
      case 'saveCurrentSchedule':
        saveCurrentSchedule(request.name, sendResponse);
        break;
      case 'clearCurrentSchedule':
        clearCurrentSchedule();
        break;
      case 'loadSchedules':
        loadSchedules(sendResponse);
        break;
      default:
        console.log('INTERNAL ERROR: no message listener for ', request);
    }
    return true;
  });
