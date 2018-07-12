'use strict';

const saveScheduleButton = document.getElementById('save-schedule-button');
const clearScheduleButton = document.getElementById('clear-schedule-button');
const saveScheduleText = document.getElementById('save-schedule-text');
const schedulesList = document.getElementById('schedules-list');

const currentSemester = '2018-2';
const url = 'http://buscacursos.uc.cl';
const currentCookieName = `cursosuc-${currentSemester}`;
const cookieDetail = {
  url,
  name: currentCookieName,
};

function reloadPage() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
  });
}

function removeElementById(id) {
  const element = document.getElementById(id);
  if (!element) return;

  element.parentNode.removeChild(element);
}

function getFullName(shortName) {
  return `cursosuc-${currentSemester}-${shortName}`;
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

function deleteSchedule(name) {
  chrome.cookies.remove({ url, name });
  removeElementById(name);
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

function createScheduleItem(name) {
  const scheduleItem = document.createElement('li');

  const selectScheduleButton = document.createElement('button');
  selectScheduleButton.onclick = () => selectSchedule(name);
  selectScheduleButton.appendChild(document.createTextNode(name));

  const deleteScheduleButton = document.createElement('button');
  deleteScheduleButton.onclick = () => deleteSchedule(name);
  deleteScheduleButton.appendChild(document.createTextNode('Borrar'));

  scheduleItem.appendChild(selectScheduleButton);
  scheduleItem.appendChild(deleteScheduleButton);

  scheduleItem.setAttribute('id', name);
  schedulesList.appendChild(scheduleItem);
}

saveScheduleButton.onclick = function(element) {
  const name = saveScheduleText.value;
  if (!name) {
    // TODO: show error
    console.log('NO NAME PROVIDED');
    return;
  }
  // chrome.storage.sync.get(['schedules'], function(result) {
  //   const { schedules } = result;
  //   schedules.push({ hola: 1 });
  //   chrome.storage.sync.set({ schedules });
  // });
  chrome.cookies.get(cookieDetail, function(cookie) {
    if (!cookie || !cookie.value) {
      // TODO: add error message: 'no classes added to schedule'
      console.log('NO SCHEDULE FOUND (TO SAVE)');
      return;
    }
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
      createScheduleItem(cookieSaved.name);
    });
  });
}

clearScheduleButton.onclick = function(element) {
  chrome.cookies.remove({ url, name: currentCookieName });
  reloadPage();
}

chrome.cookies.getAll({ url }, function(allCookies) {
  const cookies = allCookies.filter(cookie =>
    cookie.name && cookie.name.startsWith('cursosuc') &&
    cookie.name !== currentCookieName);
  if (!cookies) {
    console.log('NO SCHEDULES FOUND');
    return;
  }
  cookies.forEach(cookie => createScheduleItem(cookie.name));
})


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
