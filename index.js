const fetch = require('node-fetch');
const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
// const imgcat = require('imgcat');
const pad = require('pad');
const apiUrl = 'http://rakuten-towerman.azurewebsites.net/towerman-restapi/rest/cafeteria/menulist?menuDate=';

const optionDefinitions = [
  { name: 'floor', alias: 'f', type: Number }
];

const options = commandLineArgs(optionDefinitions);

function getDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad(2, now.getMonth() + 1, '0');
  const day = pad(2, now.getDay() + 1, '0');
  return `${year}${month}${day}`;
}

function filterItems(items, mealTime) {
  // meal time
  items = items.filter((item) => item.mealTime === mealTime);

  // floor
  if (options.floor !== null && [9, 22].includes(options.floor)) {
    items = items.filter((item) => item.cafeteriaId === `${options.floor}F`);
  }

  return items;
}

function displayMenu(body) {
  const mealTime = new Date().getHours() < 15 ? 1 : 2;
  const mealTimeTitle = mealTime === 1 ? 'Lunch' : 'Dinner';
  const items = filterItems(body.data, mealTime);
  let floor = '';

  console.log(chalk.hex('#bf0000').bold.underline(`Rakuten Crimson House ${mealTimeTitle} Menu\n`));

  items.forEach((item) => {
    if (floor !== item.cafeteriaId) {
      if (floor !== '') {
        console.log('');
      }

      floor = item.cafeteriaId;
      console.log(chalk.bold.underline(floor));
    }

    console.log(`${pad(item.menuType, 11)}: ${item.title}`);
  });
}

function fetchMenu() {
  const menuDate = getDate();
  fetch(apiUrl + menuDate)
    .then(res => res.json())
    .then(body => {
      if (body.result !== 'SUCCESS') {
        console.error(chalk.red('ERROR:'), body.errorMessage);
        return;
      }

      displayMenu(body);
    });
}

exports.fetchMenu = fetchMenu;
