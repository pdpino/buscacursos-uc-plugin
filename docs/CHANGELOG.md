# Changelog

## Unreleased

## 0.3.1 - 2018-08-01
### Fixed
* Add expiration date to saved cookie, so it isn't saved as session cookie. This fixes a bug that caused deletion of the current schedule when closing the browser.

## 0.3.0 - 2018-07-23
### Added
* Button to override existing schedule with current one. A notification is shown
* Button to edit saved schedule's name

### Changed
* Wrap schedule name on button (not in whole item)

## 0.2 - 2018-07-22
### Changed
* Move logic functions that handle storage and cookies to background.js. Leave only html functions in popup.js

## 0.1 - 2018-07-20
### Added
* Basic functionalities:
  - Save current schedule using a name
  - Clear current schedule (remove all courses)
  - Load saved schedule
  - Remove saved schedules
