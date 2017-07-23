const fetch = require('node-fetch');
const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
// const imgcat = require('imgcat');
const pad = require('pad');
const apiUrl = 'http://rakuten-towerman.azurewebsites.net/towerman-restapi/rest/cafeteria/menulist?menuDate=';

const optionDefinitions = [
  { name: 'date', alias: 'd', type: String },
  { name: 'floor', alias: 'f', type: Number },
  { name: 'show-images', type: Boolean },
  { name: 'time', alias: 't', type: String }
];

const options = commandLineArgs(optionDefinitions);

function formatDate(date) {
  return `${date.substr(0, 4)}\\${date.substr(4, 2)}\\${date.substr(6, 2)}`;
}

function makeDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad(2, now.getMonth() + 1, '0');
  const day = pad(2, now.getDate(), '0');

  return `${year}${month}${day}`;
}

function getDate(formatted = false) {
  const date = typeof options.date !== 'undefined' ?
    options.date :
    makeDate();

  return formatted ?
    formatDate(date) :
    date;
}

function filterItems(items, mealTime) {
  // meal time
  items = items.filter((item) => item.mealTime === mealTime);

  // floor
  if (typeof options.floor !== 'undefined' && [9, 22].includes(options.floor)) {
    items = items.filter((item) => item.cafeteriaId === `${options.floor}F`);
  }

  return items;
}

function displayMenu(body) {
  let mealTime = new Date().getHours() < 15 ? 1 : 2;

  if (typeof options.time !== 'undefined' && ['dinner', 'lunch'].includes(options.time)) {
    mealTime = options.time === 'lunch' ? 1 : 2;
  }

  const mealTimeTitle = mealTime === 1 ? 'Lunch' : 'Dinner';
  const items = filterItems(body.data, mealTime);

  const title = `Rakuten Crimson House ${mealTimeTitle} Menu for ${getDate(true)}`;
  console.log(chalk.hex('#bf0000').bold.underline(title));

  if (items.length === 0) {
    return console.log('No menu found!');
  }

  if (options['show-images'] === true) {
    console.log('fetching images');

    if (!process.env.TERM.includes('iterm')) {
      console.log('Sorry your terminal doesn\'t support image output');
    }
  }

  print(items);
}

function print(items) {
  let floor = '';
  let output = '';

  items.forEach((item) => {
    if (floor !== item.cafeteriaId) {
      floor = item.cafeteriaId;
      output += `\n${chalk.bold.underline(floor)}\n`;
    }

    const menuType = chalk.hex('#ccc')(pad(item.menuType, 12));
    const price = item.price > 0 ?
      chalk.bold(` (¥${item.price})`) :
      '';

    output += `${menuType} ${item.title}${price}\n`;
  });

  console.log(output);
}

function fetchMenu() {
  const menuDate = getDate();

  fetch(apiUrl + menuDate)
    .then(res => res.json())
    .then(body => {
      if (body.result !== 'SUCCESS') {
        console.log(body);
        return console.error(chalk.red('ERROR:'), body.errorMessage);
      }

      displayMenu(body);
    });
}

exports.fetchMenu = fetchMenu;
