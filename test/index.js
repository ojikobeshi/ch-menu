const assert = require('assert');
const fs = require('fs');
const path = require('path');
const proxyquire = require('proxyquire');
const fetchMock = require('fetch-mock');
const sinon = require('sinon');
const fetchSandbox = fetchMock.sandbox();
const progressSpy = sinon.stub().callsFake(() => { return true; });
const imgcatSpy = sinon.stub().resolves(true);
const CrimsonHouseMenu = proxyquire('../lib/index', {
  imgcat: imgcatSpy,
  'node-fetch': fetchSandbox,
  progress: progressSpy
});

function instanceWithOptions(options) {
  return new CrimsonHouseMenu(options);
}

function instanceWithoutOptions() {
  return new CrimsonHouseMenu({});
}

function getMockData() {
  return new Promise((resolve, reject) => {
    const mockFile = path.join(__dirname, 'response.json');
    fs.readFile(mockFile, 'utf-8', (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
}

function removedProp(items, prop) {
  return items.find(item => item.ingredients[prop]);
}

describe('CrimsonHouseMenu', function() {
  describe('displayMenu', function() {
    before(function() {
      this.emptyData = { data: [] };
      this.mockItems = [1, 2, 3];
    });

    describe('menu title', function() {
      beforeEach(function() {
        this.date = [2018, 10, 24];
        this.instance = instanceWithOptions({
          date: this.date.join('')
        });
        const filterStub = sinon.stub(this.instance, 'filterAndSortItems').callsFake(() => []);
        this.logStub = sinon.stub(this.instance, 'log');
      });

      it('contains formatted date', function() {
        this.instance.displayMenu(this.emptyData);
        assert(this.logStub.calledWithMatch(this.date.join('/')));
      });

      describe('menu time in title', function() {
        it('during lunch time', function() {
          const mealTimeStub = sinon.stub(this.instance, 'mealTime').get(function getterFn() {
            return 1;
          });
          this.instance.displayMenu(this.emptyData);
          assert(this.logStub.calledWithMatch(/lunch/));
        });

        it('during dinner time', function() {
          const mealTimeStub = sinon.stub(this.instance, 'mealTime').get(function getterFn() {
            return 2;
          });
          this.instance.displayMenu(this.emptyData);
          assert(this.logStub.calledWithMatch(/dinner/));
        });
      });
    });

    describe('items array is empty', function() {
      it('prints no menu message', function() {
        const instance = instanceWithoutOptions();
        const filterStub = sinon.stub(instance, 'filterAndSortItems').callsFake(() => []);
        const logStub = sinon.stub(instance, 'log');

        instance.displayMenu(this.emptyData);
        sinon.assert.calledTwice(logStub);
        // TODO: move text to config
        assert(logStub.calledWith('No menu found!'));
      });
    });

    describe('show images option is false', function() {
      it('calls print method with items', function() {
        const instance = instanceWithoutOptions();
        const filterStub = sinon.stub(instance, 'filterAndSortItems').callsFake(() => this.mockItems);
        const logStub = sinon.stub(instance, 'log');
        const printStub = sinon.stub(instance, 'print');

        instance.displayMenu(this.emptyData);
        sinon.assert.calledOnce(logStub);
        assert(printStub.calledWith(this.mockItems));
      });
    });

    describe('show images option is true', function() {
      it('calls fetchImages', function() {
        const instance = instanceWithOptions({ 'show-images': true });
        const filterStub = sinon.stub(instance, 'filterAndSortItems').callsFake(() => this.mockItems);
        const logStub = sinon.stub(instance, 'log');
        const fetchImageStub = sinon.stub(instance, 'fetchImages');
        instance.displayMenu(this.emptyData);

        sinon.assert.calledOnce(fetchImageStub);
        sinon.assert.calledWith(fetchImageStub, this.mockItems);
      });
    });
  });

  describe('excludeItems', function() {
    before(function() {
      this.instance = instanceWithoutOptions();
    });

    beforeEach(async function() {
      this.mockData = await getMockData();
    });

    after(function() {
      sinon.stub.reset();
    });

    describe('ingredient', function() {
      it('removes items with matching ingredients', function() {
        const { data } = this.mockData;
        const itemOne = removedProp(data, 'alcohol');
        const itemTwo = removedProp(data, 'beef');
        let items = this.instance.excludeItems(data, 'alcohol');
        items = this.instance.excludeItems(items, 'beef');
        assert.equal(items.includes(itemOne), false);
        assert.equal(items.includes(itemTwo), false);
      });
    });

    describe('menuType', function() {
      it('excludes type Halal', function() {
        const { data } = this.mockData;
        const halalDish = data.find(item => item.menuType === 'Halal');
        const items = this.instance.excludeItems(data, 'halal');
        assert(items.includes(halalDish) === false);
      });
    });

    describe('invalid option', function() {
      it('returns initial items', function() {
        const { data } = this.mockData;
        const items = this.instance.excludeItems(data, 'bleep');
        assert.equal(items, data);
      });
    });
  });

  describe('fetchMenu', function() {
    after(function() {
      fetchSandbox.restore();
      sinon.stub.reset();
    });

    describe('successful request', function() {
      it('calls API with date param', function() {
        const date = '20030630';
        const apiUrl = 'http://rakuten-towerman.azurewebsites.net/towerman-restapi/rest/cafeteria/menulist?menuDate=';
        fetchSandbox.mock(apiUrl + date, { result: 'SUCCESS' });
        const instance = instanceWithOptions({ date });
        const displayMock = sinon.stub(instance, 'displayMenu').callsFake(() => true);

        instance.fetchMenu();
        assert(fetchSandbox.lastUrl().endsWith(`menuDate=${date}`));
      });
    });
  });

  describe('fetchImages', function() {
    describe('Terminal app is not supported', function() {
      before(function() {
        process.env.TERM_PROGRAM = 'not_iTerm';
        this.instance = instanceWithOptions({ 'show-images': true });
        this.logStub = sinon.stub(this.instance, 'log');
        this.printStub = sinon.stub(this.instance, 'print');
        this.instance.fetchImages({});
      });

      it('prints unsupported terminal notification items', function() {
        sinon.assert.calledOnce(this.logStub);
        sinon.assert.calledOnce(this.printStub);
      });

      it('reset show images option to false', function() {
        assert.equal(this.instance.options['show-images'], false);
      })
    });

    describe('Terminal app is supported', function() {
      before(async function() {
        const floor = 9;
        process.env.TERM_PROGRAM = 'iTerm.app';
        this.instance = instanceWithOptions({ floor });
        this.mockData = await getMockData();
        this.logStub = sinon.stub(this.instance, 'log');
        this.printStub = sinon.stub(this.instance, 'print');
        this.items = this.instance.filterAndSortItems(this.mockData.data);
      });

      beforeEach(function() {
        this.instance.fetchImages(this.items);
      });

      it('fetches all images using imgcat', function() {
        assert.equal(imgcatSpy.callCount, this.items['9F'].length);
      });

      it('eventually calls print', function() {
        sinon.assert.calledOnce(this.printStub);
      });

      it('creates progress bar', function() {
        sinon.assert.calledThrice(progressSpy);
      });
    });
  });

  describe('filterAndSortItems', function() {
    it('returns empty array when length of items is zero', function() {
      const instance = instanceWithoutOptions();
      const items = instance.filterAndSortItems([]);
      assert.equal(items.length, 0);
    });

    describe('filters', function() {
      beforeEach(async function() {
        this.mockData = await getMockData();
      });

      it('filters by floor', function() {
        const floor = 9;
        const instance = instanceWithOptions({ floor });
        const items = instance.filterAndSortItems(this.mockData.data);
        const keys = Object.keys(items);
        assert.equal(keys.length, 1);
        assert.equal(keys[0], `${floor}F`);
        assert.equal(items[keys[0]][0].cafeteriaId, `${floor}F`);
      });

      it('filters by mealtime', function() {
        const instance = instanceWithOptions({ time: 'lunch' });
        const items = instance.filterAndSortItems(this.mockData.data);
        const keys = Object.keys(items);
        const allItems = Object.assign(items[keys[0]], items[keys[1]]);
        const allItemsWithMealtime = allItems.filter((el) => el.mealTime === 1);
        assert.equal(allItems.length, allItemsWithMealtime.length);
      });

      it('filters healthy only items', function() {
        const instance = instanceWithOptions({
          floor: 22,
          'healthy-only': true,
          time: 'lunch'
        });
        const items = instance.filterAndSortItems(this.mockData.data);
        const keys = Object.keys(items);
        assert.equal(items[keys[0]][0].title, 'Healthy Item');
      });
    });

    describe('exclude option', function() {
      beforeEach(async function() {
        this.mockData = await getMockData();
      });

      it('calls exclude once for each value passed', function() {
        const exclude = ['a', 'b', 'c'];
        const instance = instanceWithOptions({ exclude });
        const excludeStub = sinon.stub(instance, 'excludeItems').returnsArg(0);
        const items = instance.filterAndSortItems(this.mockData.data);
        sinon.assert.callCount(excludeStub, exclude.length);
      });

      it('sorts items by menuType', function() {
        const floor = 9;
        const instance = instanceWithOptions({ floor });
        const items = instance.filterAndSortItems(this.mockData.data);
        const menuTypes = items[`${floor}F`].map((el) => el.menuType);
        const isSorted = !!menuTypes.reduce((memo, el) => memo && el >= memo && el);
        assert(isSorted);
      });

      it('returns an object containing one object for each floor', function() {
        const floor = 9;
        const instanceWithOneFloor = instanceWithOptions({ floor });
        const instanceWithTwoFloors = instanceWithoutOptions();
        const itemsOne = instanceWithOneFloor.filterAndSortItems(this.mockData.data);
        const itemsTwo = instanceWithTwoFloors.filterAndSortItems(this.mockData.data);
        assert.equal(Object.keys(itemsOne).length, 1);
        assert.equal(Object.keys(itemsTwo).length, 2);
      });
    });
  });

  describe('getDate', function() {
    describe('without date option', function() {
      const instance = instanceWithoutOptions();

      describe('unformatted', function() {
        it('should return unformatted date string', function() {
          assert(!!instance.getDate().match(/\d{8}/));
        });
      });

      describe('formatted', function() {
        it('should return formatted date string', function() {
          assert(!!instance.getDate(true).match(/\d{4}\/\d{2}\/\d{2}/));
        });
      });
    });

    describe('with date option', function() {
      const date = '19960101';
      const instance = instanceWithOptions({ date });

      describe('unformatted', function() {
        it('should return unformatted date string from options', function() {
          assert.equal(instance.getDate(), date);
        });
      });

      describe('formatted', function() {
        it('should return formatted date string from options', function() {
          assert.equal(instance.getDate(true), '1996/01/01');
        });
      });
    });
  });

  describe('get mealTime', function() {
    // TODO: import these values
    const lunchTime = 1;
    const dinnerTime = 2;

    describe('with time option', function() {
      it('returns time set in options', function() {
        const lunchInstance = instanceWithOptions({ time: 'lunch' });
        const dinnerInstance = instanceWithOptions({ time: 'dinner' });
        assert.equal(lunchInstance.mealTime, lunchTime);
        assert.equal(dinnerInstance.mealTime, dinnerTime);
      });
    });

    describe('without time option', function() {
      let clock;

      after(function() {
        clock.restore();
      });

      it('returns time based on current time', function() {
        clock = sinon.useFakeTimers(new Date(2011, 0, 1, 10, 15).getTime());
        const instance = instanceWithoutOptions();
        assert.equal(instance.mealTime, lunchTime);
        clock = sinon.useFakeTimers(new Date(2011, 0, 1, 15, 15).getTime());
        assert.equal(instance.mealTime, dinnerTime);
      });
    });
  });

  describe('help', function() {
    before(function() {
      this.helpText = "HELP FILE CONTENT";
      sinon.stub(fs, 'readFileSync').callsFake(() => this.helpText);
      sinon.stub.reset();
    });

    after(function() {
      sinon.stub.reset();
    });

    it('should read the help file and print its content', function() {
      const instance = instanceWithoutOptions();
      const logStub = sinon.stub(instance, 'log').callsFake(() => false);
      instance.help();
      sinon.assert.calledOnce(logStub);
      sinon.assert.calledWith(logStub, this.helpText);
    });
  });

  describe('isOptionSet', function() {
    it('returns wheter options is set or not', function() {
      const instance = instanceWithOptions({
        testOption: true,
        'another-option': 'some value'
      });
      assert(instance.isOptionSet('testOption'));
      assert(instance.isOptionSet('another-option'));
      assert.equal(instance.isOptionSet('unsetOption'), false);
    });
  });

  describe('print', function() {
    beforeEach(async function() {
      this.mockData = await getMockData();
    });

    describe('show images option is active', function() {
      before(function() {
        this.instance = instanceWithOptions({ 'show-images': true });
        this.logStub = sinon.stub(this.instance, 'log');
      });

      after(function() {
        sinon.stub.reset();
      });

      it('formated line contains the item image', function() {
        const { data } = this.mockData;
        const items = { [data[0].cafeteriaId]: [data[0]] };
        const image = 'test image blob';
        const images = {}
        images[data[0].menuId] = image;
        this.instance.print(items, images);
        sinon.assert.calledTwice(this.logStub);
        sinon.assert.calledWith(this.logStub, sinon.match(image));
      });
    });

    describe('without show images option', function() {
      before(function() {
        this.instance = instanceWithoutOptions();
        this.logStub = sinon.stub(this.instance, 'log');
      });

      afterEach(function() {
        // sinon.stub.reset();
      })

      it('calls log with the floor headline and item info', function() {
        const { data } = this.mockData;
        const items = { [data[0].cafeteriaId]: [data[0]] };
        this.instance.print(items);
        sinon.assert.calledTwice(this.logStub);
        sinon.assert.calledWith(this.logStub, sinon.match(data[0].cafeteriaId));
        sinon.assert.calledWith(this.logStub, sinon.match(data[0].title));
      });

      it('adds item price', function() {
        const { data } = this.mockData;
        const itemWithPrice = data.find((el) => el.price > 0);
        const items = { '9F': [itemWithPrice] };
        this.instance.print(items);
        sinon.assert.calledWith(this.logStub, sinon.match(` (¥${itemWithPrice.price})`));
      });

      it('adds healthy info', function() {
        const { data } = this.mockData;
        const healthyItem = data.find((el) => el.ingredients.healthy);
        const items = { '9F': [healthyItem] };
        this.instance.print(items);
        sinon.assert.calledWith(this.logStub, sinon.match(' (healthy)'));
      });
    });
  });
});
