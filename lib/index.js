const fetch = require('node-fetch');
const fs = require('fs');
const chalk = require('chalk');
const imgcat = require('imgcat');
const pad = require('pad');
const path = require('path');
const ProgressBar = require('progress');

const apiUrl = 'http://rakuten-towerman.azurewebsites.net/towerman-restapi/rest/cafeteria/menulist?menuDate=';
const imageSize = '300px';
const LUNCH = 1;
const DINNER = 2;

class CrimsonHouseMenu {
  constructor(options) {
    this.options = options;
  }

  displayMenu(body) {
    const mealTimeTitle = this.mealTime === LUNCH ? 'Lunch' : 'Dinner';
    const items = this.filterAndSortItems(body.data);

    const title = `Rakuten Crimson House ${mealTimeTitle} Menu for ${this.getDate(true)}`;
    console.log(chalk.hex('#bf0000').bold.underline(title));

    if (items.length === 0) {
      return console.log('No menu found!');
    }

    if (this.options['show-images'] !== true) {
      return this.print(items);
    }

    if (process.env.TERM_PROGRAM !== 'iTerm.app') {
      console.log('\nSorry your terminal doesn\'t support image line.\n');
      return this.print(items);
    }

    const images = {};
    const bar = new ProgressBar('Fetching images [:bar] :percent', {
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
            console.log(`\n${chalk.hex('#6ec14c')('✔')} complete`);
            this.print(items, images);
          }
        })
        .catch((e) => {
          console.error(e.name);
        });
    });
  }

  fetchMenu() {
    const menuDate = this.getDate();

    fetch(apiUrl + menuDate)
      .then(res => {
        if (res.ok) {
          return res.json();
        }

        throw new Error('Network response was not ok.');
      })
      .then(body => {
        if (body.result !== 'SUCCESS') {
          return console.log(chalk.red('ERROR:'), body.errorMessage);
        }

        return this.displayMenu(body);
      })
      .catch(error => {
        console.error('There has been a problem fetching the menu: ' + error.message)
      })
  }

  excludeItems(items, prop) {
    if (['alcohol', 'beef', 'chicken', 'fish', 'healthy', 'mutton', 'pork'].includes(prop)) {
      return items.filter(item => !item.ingredients[prop]);
    }

    if (prop === 'halal') {
      return items.filter(item => item.menuType !== 'Halal');
    }
  }

  filterAndSortItems(items) {
    let filteredItems = items;

    // Filter meal time
    filteredItems = filteredItems.filter(item => item.mealTime === this.mealTime);

    // Exclude certain items
    if (this.isOptionSet('exclude')) {
      const excludeProps = this.options.exclude;

      for(let prop of excludeProps) {
        filteredItems = this.excludeItems(filteredItems, prop.toLowerCase());
      }
    }

    // Filter healthy items only
    if (this.isOptionSet('healthy-only')) {
      filteredItems = filteredItems.filter(item => item.ingredients.healthy === true);
    }

    // Filter by floor - sort by floor if both are displayed
    if (this.isOptionSet('floor')) {
      filteredItems = filteredItems.filter(item => item.cafeteriaId === `${this.options.floor}F`);
    } else {
      filteredItems = filteredItems.sort((a, b) => parseInt(a.cafeteriaId) - parseInt(b.cafeteriaId));
    }

    return filteredItems;
  }

  formatDate(date) {
    return `${date.substr(0, 4)}\\${date.substr(4, 2)}\\${date.substr(6, 2)}`;
  }

  get mealTime() {
    if (this.isOptionSet('time')) {
      return this.options.time === 'lunch'
        ? LUNCH
        : DINNER;
    }

    return new Date().getHours() < 15
      ? LUNCH
      : DINNER;
  }

  getDate(formatted = false) {
    const date = this.isOptionSet('date') ?
      this.options.date :
      this.makeDate();

    return formatted ?
      this.formatDate(date) :
      date;
  }

  help() {
    const helpText = fs.readFileSync(path.join(__dirname, 'help.txt'), 'utf8');
    console.log(helpText);
  }

  isOptionSet(option) {
    const thisOption = this.options[option];

    return typeof thisOption !== 'undefined' && thisOption !== null;
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
    let padSize = 1;
    const showImages = this.options['show-images'] === true;
    if (!showImages) {
      const menuTypes = items.map(item => item.menuType);
      padSize = (menuTypes.reduce((a, b) => a.length > b.length ? a : b)).length + 4;
    }

    items.forEach((item) => {
      let line = '';

      if (floor !== item.cafeteriaId) {
        floor = item.cafeteriaId;
        line += `\n${chalk.bold.underline(floor)}\n`;
      }

      const menuType = chalk.bold(pad(item.menuType, padSize));
      const price = item.price > 0 ?
        chalk.bold(` (¥${item.price})`) :
        '';

      const healthyItem = item.ingredients.healthy ?
        chalk.bold.green(' (healthy)') :
        '';

      line += `${menuType} ${item.title}${price}${healthyItem}`;

      if (showImages && typeof images[item.menuId] !== 'undefined') {
        line += `\n${images[item.menuId]}\n`;
      }

      console.log(line);
    });
  }
}

module.exports = CrimsonHouseMenu;
