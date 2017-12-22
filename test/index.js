var assert = require('assert');
var fs = require('fs');
var path = require('path');
var proxyquire = require('proxyquire');
var fetchMock = require('fetch-mock');
var sinon = require('sinon');
var fetchSandbox = fetchMock.sandbox();
var CrimsonHouseMenu = proxyquire('../lib/index', {
  'node-fetch': fetchSandbox
});

function instanceWithOptions(options) {
  return new CrimsonHouseMenu(options);
}

function instanceWithoutOptions() {
  return new CrimsonHouseMenu({});
}

function getMockData() {
  return new Promise((resolve, reject) => {
    var mockFile = path.join(__dirname, 'response.json');
    fs.readFile(mockFile, 'utf-8', (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
}

function removedProp(items, prop) {
  return items.find(item => item.ingredients[prop]);
}

describe('CrimsonHouseMenue', function() {
  describe('displayMenu', function() {
    before(function() {
      this.emptyData = { data: [] };
      this.mockItems = [1, 2, 3];
    });

    describe('items array is empty', function() {
      it('prints title and returns no menu message', function() {
        var instance = instanceWithoutOptions();
        var filterStub = sinon.stub(instance, 'filterAndSortItems').callsFake(() => []);
        var logStub = sinon.stub(instance, 'log');

        instance.displayMenu(this.emptyData);
        sinon.assert.calledTwice(logStub);
        // TODO: move text to config
        assert(logStub.calledWith('No menu found!'));
      });
    });

    describe('show images option is false', function() {
      it('calls print method with items', function() {
        var instance = instanceWithoutOptions();
        var filterStub = sinon.stub(instance, 'filterAndSortItems').callsFake(() => this.mockItems);
        var logStub = sinon.stub(instance, 'log');
        var printStub = sinon.stub(instance, 'print');

        instance.displayMenu(this.emptyData);
        sinon.assert.calledOnce(logStub);
        assert(printStub.calledWith(this.mockItems));
      });
    });

    describe('show images option is true', function() {
      describe('terminal app is not supported', function() {
        it('logs a notification and prints items', function() {
          process.env.TERM_PROGRAM = 'some unsupported terminal';
          var instance = instanceWithOptions({ 'show-images': true });
          var filterStub = sinon.stub(instance, 'filterAndSortItems').callsFake(() => this.mockItems);
          var logStub = sinon.stub(instance, 'log');
          var printStub = sinon.stub(instance, 'print');

          instance.displayMenu(this.emptyData);
          sinon.assert.calledTwice(logStub);
          assert.equal(instance.options['show-images'], false);
          assert(printStub.calledWith(this.mockItems));
        });
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
        var { data } = this.mockData;
        var itemOne = removedProp(data, 'alcohol');
        var itemTwo = removedProp(data, 'beef');
        var items = this.instance.excludeItems(data, 'alcohol');
        items = this.instance.excludeItems(items, 'beef');
        assert.equal(items.includes(itemOne), false);
        assert.equal(items.includes(itemTwo), false);
      });
    });

    describe('menuType', function() {
      it('excludes type Halal', function() {
        var { data } = this.mockData;
        var halalDish = data.find(item => item.menuType === 'Halal');
        var items = this.instance.excludeItems(data, 'halal');
        assert(items.includes(halalDish) === false);
      });
    });

    describe('invalid option', function() {
      it('returns initial items', function() {
        var { data } = this.mockData;
        var items = this.instance.excludeItems(data, 'bleep');
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
        var date = '20030630';
        var apiUrl = 'http://rakuten-towerman.azurewebsites.net/towerman-restapi/rest/cafeteria/menulist?menuDate=';
        fetchSandbox.mock(apiUrl + date, { result: 'SUCCESS' });
        var instance = instanceWithOptions({ date });
        var displayMock = sinon.stub(instance, 'displayMenu').callsFake(() => true);

        instance.fetchMenu();
        assert(fetchSandbox.lastUrl().endsWith(`menuDate=${date}`));
      });
    });
  });

  describe('formatDate', function() {
    it('returns the date in the format YYYY\MM\DD', function() {
      var instance = instanceWithOptions();
      assert.equal(instance.formatDate('20130912'), '2013\\09\\12');
    });
  });

  describe('filterAndSortItems', function() {
    it('returns empty array when length of items is zero', function() {
      var instance = instanceWithoutOptions();
      var items = instance.filterAndSortItems([]);
      assert.equal(items.length, 0);
    });

    describe('filters', function() {
      beforeEach(async function() {
        this.mockData = await getMockData();
      });

      it('filters by floor', function() {
        var floor = 9;
        var instance = instanceWithOptions({ floor });
        var items = instance.filterAndSortItems(this.mockData.data);
        var keys = Object.keys(items);
        assert.equal(keys.length, 1);
        assert.equal(keys[0], `${floor}F`);
        assert.equal(items[keys[0]][0].cafeteriaId, `${floor}F`);
      });

      it('filters by mealtime', function() {
        var instance = instanceWithOptions({ time: 'lunch' });
        var items = instance.filterAndSortItems(this.mockData.data);
        var keys = Object.keys(items);
        var allItems = Object.assign(items[keys[0]], items[keys[1]]);
        var allItemsWithMealtime = allItems.filter((el) => el.mealTime === 1);
        assert.equal(allItems.length, allItemsWithMealtime.length);
      });

      it('filters healthy only items', function() {
        var instance = instanceWithOptions({
          floor: 22,
          'healthy-only': true,
          time: 'lunch'
        });
        var items = instance.filterAndSortItems(this.mockData.data);
        var keys = Object.keys(items);
        assert.equal(items[keys[0]][0].title, 'Healthy Item');
      });
    });

    describe('exclude option', function() {
      beforeEach(async function() {
        this.mockData = await getMockData();
      });

      it('calls exclude once for each value passed', function() {
        var exclude = ['a', 'b', 'c'];
        var instance = instanceWithOptions({ exclude });
        var excludeStub = sinon.stub(instance, 'excludeItems').returnsArg(0);
        var items = instance.filterAndSortItems(this.mockData.data);
        sinon.assert.callCount(excludeStub, exclude.length);
      });

      it('sorts items by menuType', function() {
        var floor = 9;
        var instance = instanceWithOptions({ floor });
        var items = instance.filterAndSortItems(this.mockData.data);
        var menuTypes = items[`${floor}F`].map((el) => el.menuType);
        var isSorted = !!menuTypes.reduce((memo, el) => memo && el >= memo && el);
        assert(isSorted);
      });

      it('returns an object containing one object for each floor', function() {
        var floor = 9;
        var instanceWithOneFloor = instanceWithOptions({ floor });
        var instanceWithTwoFloors = instanceWithoutOptions();
        var itemsOne = instanceWithOneFloor.filterAndSortItems(this.mockData.data);
        var itemsTwo = instanceWithTwoFloors.filterAndSortItems(this.mockData.data);
        assert.equal(Object.keys(itemsOne).length, 1);
        assert.equal(Object.keys(itemsTwo).length, 2);
      });
    });
  });

  describe('getDate', function() {
    describe('without date option', function() {
      var instance = instanceWithoutOptions();

      describe('unformatted', function() {
        it('should return unformatted date string', function() {
          assert(!!instance.getDate().match(/\d{8}/));
        });
      });

      describe('formatted', function() {
        it('should return formatted date string', function() {
          assert(!!instance.getDate(true).match(/\d{4}\\\d{2}\\\d{2}/));
        });
      });
    });

    describe('with date option', function() {
      var date = '19960101';
      var instance = instanceWithOptions({ date });

      describe('unformatted', function() {
        it('should return unformatted date string from options', function() {
          assert.equal(instance.getDate(), date);
        });
      });

      describe('formatted', function() {
        it('should return formatted date string from options', function() {
          assert.equal(instance.getDate(true), '1996\\01\\01');
        });
      });
    });
  });

  describe('get mealTime', function() {
    // TODO: import these values
    var lunchTime = 1;
    var dinnerTime = 2;

    describe('with time option', function() {
      it('returns time set in options', function() {
        var lunchInstance = instanceWithOptions({ time: 'lunch' });
        var dinnerInstance = instanceWithOptions({ time: 'dinner' });
        assert.equal(lunchInstance.mealTime, lunchTime);
        assert.equal(dinnerInstance.mealTime, dinnerTime);
      });
    });

    describe('without time option', function() {
      var clock;

      after(function() {
        clock.restore();
      });

      it('returns time based on current time', function() {
        clock = sinon.useFakeTimers(new Date(2011, 0, 1, 10, 15).getTime());
        var instance = instanceWithoutOptions();
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
      var instance = instanceWithoutOptions();
      var logStub = sinon.stub(instance, 'log').callsFake(() => false);
      instance.help();
      sinon.assert.calledOnce(logStub);
      sinon.assert.calledWith(logStub, this.helpText);
    });
  });

  describe('isOptionSet', function() {
    it('returns wheter options is set or not', function() {
      var instance = instanceWithOptions({
        testOption: true,
        'another-option': 'some value'
      });
      assert(instance.isOptionSet('testOption'));
      assert(instance.isOptionSet('another-option'));
      assert.equal(instance.isOptionSet('unsetOption'), false);
    });
  });

  describe('makeDate', function() {
    before(function() {
      this.date = sinon.useFakeTimers(new Date(2017, 0, 1).getTime());
    });

    after(function() {
      this.date.restore();
    });

    it('returns todays date in YYYYMMMDD format', function() {
      var instance = instanceWithoutOptions();
      assert.equal(instance.makeDate(), '20170101');
    });
  });

  describe('print', function() {
    beforeEach(async function() {
      this.mockData = await getMockData();
    });

    describe('show images option is active', function() {
      it('calls log with the formatted item information');
      it('formated line contains the item image');
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
        var { data } = this.mockData;
        var items = { [data[0].cafeteriaId]: [data[0]] };
        this.instance.print(items);
        sinon.assert.calledTwice(this.logStub);
        sinon.assert.calledWith(this.logStub, sinon.match(data[0].cafeteriaId));
        sinon.assert.calledWith(this.logStub, sinon.match(data[0].title));
      });

      it('adds item price', function() {
        var { data } = this.mockData;
        var itemWithPrice = data.find((el) => el.price > 0);
        var items = { '9F': [itemWithPrice] };
        this.instance.print(items);
        sinon.assert.calledWith(this.logStub, sinon.match(` (¥${itemWithPrice.price})`));
      });
      it('adds healthy info', function() {
        var { data } = this.mockData;
        var healthyItem = data.find((el) => el.ingredients.healthy);
        var items = { '9F': [healthyItem] };
        this.instance.print(items);
        sinon.assert.calledWith(this.logStub, sinon.match(' (healthy)'));
      });
    });
  });
});
