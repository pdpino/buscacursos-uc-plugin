'use strict'

// DEPRECATED (is not called from options.html)

const schedulesListContainer = document.getElementById('schedules-list-container');

function showSchedulesList() {
  chrome.storage.sync.get(['schedules'], (result) => {
    const { schedules } = result;
    if (schedules && schedules.length > 0) {
      const schedulesList = document.createElement('ul');
      schedules.forEach((schedule) => {
        const item = document.createElement('li');
        item.appendChild(document.createTextNode(schedule.name));
        schedulesList.appendChild(item);
      });

      schedulesListContainer.appendChild(schedulesList);
    } else {
      const emptyText = 'No tienes horarios guardados';
      schedulesListContainer.appendChild(document.createTextNode(emptyText));
    }
  });
}

showSchedulesList();
