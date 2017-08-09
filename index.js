const fetch = require('node-fetch');
const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const imgcat = require('imgcat');
const pad = require('pad');
const ProgressBar = require('progress');

const apiUrl = 'http://rakuten-towerman.azurewebsites.net/towerman-restapi/rest/cafeteria/menulist?menuDate=';
const imageSize = '300px';

const optionDefinitions = [
  { name: 'date', alias: 'd', type: String },
  { name: 'floor', alias: 'f', type: Number },
  { name: 'show-images', type: Boolean },
  { name: 'time', alias: 't', type: String },
];

const options = commandLineArgs(optionDefinitions);

class CrimsonHouseMenu {
  constructor(options) {
    this.options = options;
  }

  displayMenu(body) {
    let mealTime = new Date().getHours() < 15 ? 1 : 2;
    const showImages = this.options['show-images'];

    if (this.options.time !== null) {
      mealTime = this.options.time === 'lunch' ? 1 : 2;
    }

    const mealTimeTitle = mealTime === 1 ? 'Lunch' : 'Dinner';
    const items = this.filterItems(body.data, mealTime);

    const title = `Rakuten Crimson House ${mealTimeTitle} Menu for ${this.getDate(true)}`;
    console.log(chalk.hex('#bf0000').bold.underline(title));

    if (items.length === 0) {
      return console.log('No menu found!');
    }

    if (showImages === true) {
      if (process.env.TERM_PROGRAM !== 'iTerm.app') {
        console.log('Sorry your terminal doesn\'t support image output');
        return this.print(items);
      }

      const images = {};
      const bar = new ProgressBar('Fetching Images [:bar] :percent', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: items.length,
      });

      items.forEach((item) => {
        imgcat(item.imageURL, { width: imageSize })
          .then((image) => {
            images[item.menuId] = image;
            bar.tick(1);

            if (Object.keys(images).length === items.length) {
              console.log(`\n${chalk.hex('#6ec14c')('✔')} complete\n`);
              this.print(items, images);
            }
          })
          .catch((e) => {
            console.log(e.name);
          });
      });
    } else {
      this.print(items);
    }
  }

  fetchMenu() {
    const menuDate = this.getDate();

    fetch(apiUrl + menuDate)
      .then(res => res.json())
      .then((body) => {
        if (body.result !== 'SUCCESS') {
          return console.error(chalk.red('ERROR:'), body.errorMessage);
        }

        return this.displayMenu(body);
      });
  }

  filterItems(items, mealTime) {
    let filteredItems = [];
    // meal time
    filteredItems = items.filter(item => item.mealTime === mealTime);

    // floor
    if (typeof this.options.floor !== 'undefined' && [9, 22].includes(this.options.floor)) {
      filteredItems = filteredItems.filter(item => item.cafeteriaId === `${this.options.floor}F`);
    }

    return filteredItems;
  }

  formatDate(date) {
    return `${date.substr(0, 4)}\\${date.substr(4, 2)}\\${date.substr(6, 2)}`;
  }

  getDate(formatted = false) {
    const date = typeof this.options.date !== 'undefined' ?
      this.options.date :
      this.makeDate();

    return formatted ?
      this.formatDate(date) :
      date;
  }

  makeDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = pad(2, now.getMonth() + 1, '0');
    const day = pad(2, now.getDate(), '0');

    return `${year}${month}${day}`;
  }

  print(items, images = {}) {
    let floor = '';
    const showImages = this.options['show-images'];

    items.forEach((item) => {
      let output = '';

      if (floor !== item.cafeteriaId) {
        floor = item.cafeteriaId;
        output += `${chalk.bold.underline(floor)}\n`;
      }

      const menuType = chalk.bold(pad(item.menuType, 12));
      const price = item.price > 0 ?
        chalk.bold(` (¥${item.price})`) :
        '';

      output += `${menuType} ${item.title}${price}`;

      if (showImages && typeof images[item.menuId] !== 'undefined') {
        output += `\n${images[item.menuId]}`;
      }

      console.log(output);
    });
  }
}

exports.CrimsonHouseMenu = new CrimsonHouseMenu(options);
