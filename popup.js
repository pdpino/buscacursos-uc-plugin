'use strict';

// COMMON DATA
const currentSemester = '2018-2';
const url = 'http://buscacursos.uc.cl';
const currentCookieName = `cursosuc-${currentSemester}`;
const currentCookieDetail = { url, name: currentCookieName };

function getFullName(shortName) {
  return `cursosuc-${currentSemester}-${shortName}`;
}

// UTILS
function reloadPage() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
  });
}

function filterUsefulCookie(cookie) {
  return {
    // REVIEW: use ...cookie and ignore 'secure' and 'hostOnly' properties
    domain: cookie.domain,
    expirationDate: cookie.expirationDate,
    httpOnly: cookie.httpOnly,
    name: cookie.name,
    path: cookie.path,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    storeId: cookie.storeId,
    value: cookie.value,
  };
}


// SCHEDULE ACTIONS
function deleteSchedule(name) {
  chrome.cookies.remove({ url, name });
}

function selectSchedule(name) {
  chrome.cookies.get({ url, name }, function(newCookie){
    chrome.cookies.remove({ url, name: currentCookieName }, function() {
      chrome.cookies.set({
        ...filterUsefulCookie(newCookie),
        url,
        name: currentCookieName,
      }, () => reloadPage());
    })
  });
}

function saveCurrentSchedule(name, itemRenderer) {
  chrome.cookies.get(currentCookieDetail, function(cookie) {
    if (!cookie || !cookie.value) {
      // TODO: add error message: 'no classes added to schedule'
      console.log('NO SCHEDULE FOUND (TO SAVE)');
      return;
    }
    // TODO: save cookie.value in chrome.storage
    chrome.cookies.set({
      ...filterUsefulCookie(cookie),
      url,
      name: getFullName(name),
    }, function(cookieSaved) {
      if (!cookieSaved) {
        // TODO: show error
        console.log('COULDNT SAVE COOKIE');
        return;
      }
      itemRenderer(cookieSaved.name);
    });
  });

  // chrome.storage.sync.get(['schedules'], function(result) {
  //   const { schedules } = result;
  //   schedules.push({ hola: 1 });
  //   chrome.storage.sync.set({ schedules });
  // });
}

function clearCurrentSchedule() {
  chrome.cookies.remove({ url, name: currentCookieName }, () => reloadPage());
}

function createSchedulesList(listRenderer) {
  chrome.cookies.getAll({ url }, function(allCookies) {
    const cookies = allCookies.filter(cookie =>
      cookie.name && cookie.name.startsWith('cursosuc') &&
      cookie.name !== currentCookieName);
    if (!cookies) {
      console.log('NO SCHEDULES FOUND');
      return;
    }
    listRenderer(cookies);
  });
}



// HTML ELEMENTS
const saveScheduleButton = document.getElementById('save-schedule-button');
const clearScheduleButton = document.getElementById('clear-schedule-button');
const saveScheduleText = document.getElementById('save-schedule-text');
const schedulesList = document.getElementById('schedules-list');

// RENDERER
function renderScheduleItem(name) {
  const scheduleItem = document.createElement('li');

  const selectScheduleButton = document.createElement('button');
  selectScheduleButton.onclick = () => selectSchedule(name);
  selectScheduleButton.appendChild(document.createTextNode(name));
  selectScheduleButton.setAttribute('class', 'name-schedule');
  selectScheduleButton.setAttribute('title', 'Cargar horario');

  const deleteScheduleButton = document.createElement('button');
  deleteScheduleButton.onclick = () => {
    deleteSchedule(name);
    removeElementById(name);
  };
  deleteScheduleButton.setAttribute('class', 'delete-schedule');
  deleteScheduleButton.setAttribute('title', 'Borrar');

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

createSchedulesList(renderSchedulesList);


// chrome.storage.sync.get('color', function(data) {
//   changeColor.style.backgroundColor = data.color;
//   changeColor.setAttribute('value', data.color);
// });
// changeColor.onclick = function(element) {
//   let color = element.target.value;
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     chrome.tabs.executeScript(
//         tabs[0].id,
//         {code: 'document.body.style.backgroundColor = "' + color + '";'});
//   });
// };
