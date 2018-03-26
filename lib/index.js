const fetch = require('node-fetch');
const fs = require('fs');
const chalk = require('chalk');
const imgcat = require('imgcat');
const pad = require('pad');
const path = require('path');
const ProgressBar = require('progress');
const {
  countObjectValues,
  formatDate,
  longestValue,
  makeDate
} = require('../util/');

const apiUrl = 'http://rakuten-towerman.azurewebsites.net/towerman-restapi/rest/cafeteria/menulist?menuDate=';
const imageSize = '300px';
const LUNCH = 1;
const DINNER = 2;

class CrimsonHouseMenu {
  constructor(options) {
    this.options = options;
  }

  displayMenu(data) {
    const mealTimeTitle = this.mealTime === LUNCH ? 'lunch' : 'dinner';
    const items = this.filterAndSortItems(data);
    const title = `Rakuten Crimson House ${mealTimeTitle} menu for ${this.getDate(true)}`;
    this.log(title, 'maintitle');

    if (items.length === 0) {
      return this.log('No menu found!');
    }

    if (this.options['show-images'] !== true) {
      return this.print(items);
    }

    this.fetchImages(items);
  }

  fetchImages(items) {
    if (process.env.TERM_PROGRAM !== 'iTerm.app') {
      this.log('\nSorry your terminal doesn\'t support inline images.\n');
      this.options['show-images'] = false;
      return this.print(items);
    }

    const images = {};
    const total = countObjectValues(items);
    const bar = new ProgressBar('Fetching images [:bar] :percent', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total,
    });

    Object.keys(items).forEach((floor) => {
      items[floor].forEach((item) => {
        imgcat(item.imageURL, { width: imageSize })
          .then((image) => {
            images[item.menuId] = image;
            bar.tick(1);

            if (Object.keys(images).length === total) {
              this.log(`\n${chalk.hex('#6ec14c')('✔')} complete`);
              this.print(items, images);
            }
          })
          .catch((e) => {
            console.error(e.name);
          });
      });
    });
  }

  fetchMenu() {
    const url = apiUrl + this.getDate();

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok.');
        }

        return res.json();
      })
      .then(body => {
        if (body.result !== 'SUCCESS') {
          return this.log(body.errorMessage, 'error');
        }

        return this.displayMenu(body.data);
      })
      .catch(error => {
        this.log('There has been a problem fetching the menu: ' + error.message, 'error')
      })
  }

  excludeItems(items, prop) {
    if (['alcohol', 'beef', 'chicken', 'fish', 'healthy', 'mutton', 'pork'].includes(prop)) {
      return items.filter(item => !item.ingredients[prop]);
    }

    if (prop === 'halal') {
      return items.filter(item => item.menuType !== 'Halal');
    }

    return items;
  }

  filterAndSortItems(data) {
    let dataAr = data;
    const filtered = {};

    if (dataAr.length === 0) return [];

    // Filter by floor
    if (this.isOptionSet('floor')) {
      dataAr = dataAr.filter(item => item.cafeteriaId === `${this.options.floor}F`);
    }

    // Filter meal time
    dataAr = dataAr.filter(item => item.mealTime === this.mealTime);

    // Exclude certain items
    if (this.isOptionSet('exclude')) {
      for(let prop of this.options.exclude) {
        dataAr = this.excludeItems(dataAr, prop.toLowerCase());
      }
    }

    // Filter healthy items only
    if (this.isOptionSet('healthy-only')) {
      dataAr = dataAr.filter(item => item.ingredients.healthy === true);
    }

    dataAr.forEach((el) => {
      const { cafeteriaId } = el;

      if (!Object.keys(filtered).includes(cafeteriaId)) {
        filtered[cafeteriaId] = [];
      }

      const duplicate = (filtered[cafeteriaId].filter(item => item.menuType === el.menuType)).length;

      if (!duplicate) {
        filtered[cafeteriaId].push(el);
      }
    });

    Object.keys(filtered).forEach((floor) => {
      filtered[floor] = filtered[floor].sort((a, b) => a.menuType > b.menuType);
    });

    return filtered;
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
      makeDate();

    return formatted ?
      formatDate(date) :
      date;
  }

  help() {
    const helpText = fs.readFileSync(path.join(__dirname, 'help.txt'), 'utf8');
    this.log(helpText);
  }

  isOptionSet(option) {
    const thisOption = this.options[option];
    return typeof thisOption !== 'undefined' && thisOption !== null;
  }

  log(text, format = '') {
    let logText = text;

    switch(format) {
      case 'error':
        logText = `${chalk.red('ERROR:')} ${text}`;
        break;
      case 'maintitle':
        logText = chalk.hex('#bf0000').bold.underline(text);
        break;
      default:
        logText = text;
    }

    console.log(logText);
  }

  print(data, images = {}) {
    let floor = '';
    let padSize = 1;
    const showImages = Object.keys(images).length > 0 && this.options['show-images'] === true;

    if (!showImages) {
      let arr = [];

      Object.keys(data).forEach((floor) => {
        let menuTypes = data[floor].map((item) => item.menuType);
        arr.push(...menuTypes);
      });

      padSize = longestValue(arr) + 4;
    }

    Object.keys(data).forEach((floor) => {
      this.log(`\n${chalk.bold.underline(floor)}`);

      data[floor].forEach((item) => {
        let line = '';
        const menuType = chalk.bold(pad(item.menuType, padSize));
        const price = item.price > 0 ?
          chalk.bold(` (¥${item.price})`) :
          '';

        const healthyLabel = item.ingredients.healthy ?
          chalk.bold.green(' (healthy)') :
          '';

        line += `${menuType} ${item.title}${price}${healthyLabel}`;

        if (showImages && typeof images[item.menuId] !== 'undefined') {
          line += `\n${images[item.menuId]}\n`;
        }

        this.log(line);
      });
    });
  }
}

module.exports = CrimsonHouseMenu;
