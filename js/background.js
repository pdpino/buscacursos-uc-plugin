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

/* Utils */
function getExpirationDate() {
  const nowDate = new Date();
  const nowSeconds = nowDate.getTime() / 1000;
  const monthsToAdd = 4;
  return nowSeconds + monthsToAdd*30*24*60*60;
}

function reloadPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.reload(tabs[0].id);
  });
}


/* Cookie wrappers */
const currentSemester = '2020-2'; // Change here to update semester
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
    expirationDate: getExpirationDate(),
    value,
  }, callback);
}

function getScheduleValue(callback) {
  getCurrentCookie(function(cookie) {
    if (!cookie || !cookie.value) {
      console.log('USER ERROR: no classes added to schedule');
      return;
    }
    callback(cookie.value);
  });
}


/* Schedules basic actions */
function loadSchedules(callback) {
  chrome.storage.sync.get(['schedules'], function(result) {
    callback(result.schedules || []);
  });
}

function saveSchedules(schedules, callback) {
  chrome.storage.sync.set({ schedules }, callback);
}


/* Schedules actions */
function deleteSchedule(name, callback) {
  loadSchedules(function(schedules) {
    saveSchedules(schedules.filter(sch => sch.name !== name), callback);
  });
}

function selectSchedule(name) {
  loadSchedules(function(schedules) {
    const schedule = schedules.find(sch => sch.name === name);
    if (!schedule) {
      console.log('INTERNAL ERROR: no schedule found with', name);
      return;
    }
    saveCurrentCookie(schedule.value, reloadPage);
  });
}

function saveCurrentSchedule(name, callback) {
  getScheduleValue(function(scheduleValue) {
    loadSchedules(function(schedules) {
      if (schedules.find(sch => sch.name === name)) {
        console.log('USER ERROR: name already taken');
        return;
      }
      schedules.push({
        name,
        value: scheduleValue,
        semester: currentSemester,
      });
      saveSchedules(schedules, callback);
    });
  });
}

function updateSchedule(name, callback) {
  getScheduleValue(function(scheduleValue) {
    loadSchedules(function(schedules) {
      const index = schedules.findIndex(sch => sch.name === name)
      if (index === -1) {
        console.log('INTERNAL ERROR: cant update schedule, does not exist', name);
        return;
      }
      schedules[index].value = scheduleValue;
      saveSchedules(schedules, callback);
    });
  });
}

function clearCurrentSchedule() {
  removeCurrentCookie(reloadPage);
}

function changeScheduleName(oldName, newName, callback) {
  loadSchedules(function(schedules) {
    if (oldName === newName) {
      callback();
      return;
    }

    const index = schedules.findIndex(sch => sch.name === oldName);
    if (index === -1) {
      console.log('INTERNAL ERROR: cant change name, schedule does not exist', oldName);
      return;
    }
    if (newName !== oldName && schedules.find(sch => sch.name === newName)) {
      console.log('USER ERROR: new name is taken');
      return;
    }
    schedules[index].name = newName;
    saveSchedules(schedules, callback);
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
      case 'updateSchedule':
        updateSchedule(request.name, sendResponse);
        break;
      case 'changeScheduleName':
        changeScheduleName(request.oldName, request.newName, sendResponse);
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
