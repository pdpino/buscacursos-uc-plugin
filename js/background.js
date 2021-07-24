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
function _getCurrentCookieDetail(semester) {
  return {
    url: 'http://buscacursos.uc.cl',
    name: `cursosuc-${semester}`,
  };
}

function removeCurrentCookie(semester, callback) {
  chrome.cookies.remove(_getCurrentCookieDetail(semester), callback);
}

function saveCurrentCookie(value, semester, callback) {
  chrome.cookies.set({
    ..._getCurrentCookieDetail(semester),
    expirationDate: getExpirationDate(),
    value,
  }, callback);
}

function getScheduleValue(semester, callback) {
  chrome.cookies.get(_getCurrentCookieDetail(semester), function(cookie) {
    if (!cookie || !cookie.value) {
      console.error('USER ERROR: no classes added to schedule');
      callback(null);
      return;
    }
    callback(cookie.value);
  });
}


/* Semester actions */
function _guessSemester() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 0-based index
  const semester = (7 <= month && month <= 11) ? 2 : 1;
  return `${year}-${semester}`;
}

function _updateSemester(semester, callback) {
  chrome.storage.sync.set({ semester }, function() {
    callback(semester);
  });
}

function getSemester(callback) {
  chrome.storage.sync.get(['semester'], function(result) {
    let semester = result.semester;
    if (!semester) {
      semester = _guessSemester();
      _updateSemester(semester, callback);
    } else {
      callback(semester);
    }
  });
}

function prevSemester(callback) {
  getSemester(function(semester) {
    let [year, number] = semester.split('-').map(Number);
    if (number === 1) {
      number = 2;
      year -= 1;
    } else { // number === 2
      number = 1;
    }
    const newSemester = `${year}-${number}`;
    _updateSemester(newSemester, callback);
  });
}

function nextSemester(callback) {
  getSemester(function(semester) {
    let [year, number] = semester.split('-').map(Number);
    if (number === 2) {
      number = 1;
      year += 1;
    } else { // number === 1
      number = 2;
    }
    const newSemester = `${year}-${number}`;
    _updateSemester(newSemester, callback);
  });
}

/* Schedules basic actions */
function _loadSchedulesAndSemester(onlyThisSemester, callback) {
  chrome.storage.sync.get(['schedules', 'semester'], function(result) {
    const wasSemesterEmpty = !result.semester;
    const semester = result.semester || _guessSemester();
    let schedules = result.schedules || [];
    if (onlyThisSemester) {
      schedules = schedules.filter(sch => sch.semester === semester);
    }
    const output = {
      schedules,
      semester,
    };
    if (wasSemesterEmpty) {
      _updateSemester(semester, function() { callback(output) });
    } else {
      callback(output);
    }
  });
}

function loadThisSemesterSchedules(callback) { _loadSchedulesAndSemester(true, callback) };
function loadAllSchedules(callback) { _loadSchedulesAndSemester(false, callback) };

function saveSchedules(schedules, callback) {
  chrome.storage.sync.set({ schedules }, callback);
}


/* Schedules actions */
function deleteSchedule(name, callback) {
  loadAllSchedules(function({ schedules, semester }) {
    saveSchedules(schedules.filter(sch => sch.semester !== semester || sch.name !== name), callback);
  });
}

function selectSchedule(name) {
  loadAllSchedules(function({ schedules, semester }) {
    const schedule = schedules.find(sch => sch.semester === semester && sch.name === name);
    if (!schedule) {
      console.error(`INTERNAL ERROR: no schedule found with ${name} and semester ${semester}`);
      return;
    }
    saveCurrentCookie(schedule.value, semester, reloadPage);
  });
}

function saveCurrentSchedule(name, callback) {
  loadAllSchedules(function({ schedules, semester }) {
    getScheduleValue(semester, function(scheduleValue) {
      if (!scheduleValue) {
        callback(1);
        return;
      }
      if (schedules.find(sch => sch.semester === semester && sch.name === name)) {
        console.error('USER ERROR: name already taken, not overriding');
        callback(2);
        return;
      }
      schedules.push({
        name,
        value: scheduleValue,
        semester,
      });
      saveSchedules(schedules, callback);
    });
  });
}

function updateSchedule(name, callback) {
  loadAllSchedules(function({ schedules, semester }) {
    getScheduleValue(semester, function(scheduleValue) {
      if (!scheduleValue) {
        callback(1);
        return;
      }
      const index = schedules.findIndex(sch => sch.semester === semester && sch.name === name);
      if (index === -1) {
        console.error('INTERNAL ERROR: cannot update schedule, does not exist', name, semester);
        callback(2);
        return;
      }
      schedules[index].value = scheduleValue;
      saveSchedules(schedules, callback);
    });
  });
}

function clearCurrentSchedule() {
  getSemester(function(semester) {
    removeCurrentCookie(semester, reloadPage);
  });
}

function changeScheduleName(oldName, newName, callback) {
  if (oldName === newName) {
    callback();
    return;
  }

  loadAllSchedules(function({ schedules, semester }) {
    const index = schedules.findIndex(sch => sch.semester === semester && sch.name === oldName);
    if (index === -1) {
      console.error('INTERNAL ERROR: cannot change name, schedule does not exist', oldName, semester);
      callback(2);
      return;
    }
    if (schedules.find(sch => sch.semester === semester && sch.name === newName)) {
      console.error('USER ERROR: new name is taken');
      callback(3);
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
      case 'loadData':
        loadThisSemesterSchedules(sendResponse);
        break;
      case 'prevSemester':
        prevSemester(sendResponse);
        break;
      case 'nextSemester':
        nextSemester(sendResponse);
        break;
      default:
        console.error('INTERNAL ERROR: no message listener for ', request);
    }
    return true;
  });
