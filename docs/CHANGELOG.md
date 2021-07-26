# Changelog

## Unreleased


## 0.4.0 - 2021-07-26
### Added
* Support changing semester (remove hardcoded value)
* Tooltip indicating semester must match with website
* Settings button (redirects to extension settings)


## 0.3.9 - 2021-07-24
### Changed
* Set 2021-2 as the default semester



## 0.3.8 - 2020-12-16
### Changed
* Set 2021-1 as the default semester



## 0.3.7 - 2020-08-10
### Added
* Empty placeholder in list
* Display text with form error

### Changed
* Overall style improvements
* Save `currentSemester` as field in each schedule
* Book icon

### Fixed
* Minor fixes in async messaging



## 0.3.6 - 2020-07-20
### Changed
* Set 2020-2 as the default semester

### Fixed
* Reload page after changes
* Remove unnecessary activeTab permission



## 0.3.5 - 2019-12-13
### Changed
* Set 2020-1 as the default semester


## 0.3.4 - 2019-07-01
### Changed
* Add current semester to HTML
* Add cursor pointer to buttons


## 0.3.3 - 2019-07-01
### Changed
* Set 2019-2 as the default semester


## 0.3.2 - 2018-30-11
### Changed
* Set 2019-1 as the default semester


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
