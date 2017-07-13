const fetch = require('node-fetch');
const chalk = require('chalk');
const pad = require('pad');
const apiUrl = 'http://rakuten-towerman.azurewebsites.net/towerman-restapi/rest/cafeteria/menulist?menuDate=';

function getDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad(2, now.getMonth() + 1, '0');
  const day = pad(2, now.getDay() + 1, '0');
  return `${year}${month}${day}`;
}

function displayMenu(body) {
  const mealTime = new Date().getHours() < 15 ? 1 : 2;
  const mealTimeTitle = mealTime === 1 ? 'Lunch' : 'Dinner';
  const items = body.data.filter((item) => item.mealTime === mealTime);
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
