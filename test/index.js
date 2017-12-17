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
      resolve(JSON.parse(data).data);
    });
  });
}

function removedProp(items, prop) {
  return items.filter(item => item.ingredients[prop])[0];
}

describe('CrimsonHouseMenue', function() {
  // To be implemented
  describe('displayMenu', function() {});
  describe('filterAndSortItems', function() {});
  describe('formatDate', function() {});
  describe('makeDate', function() {});
  describe('print', function() {});

  describe('excludeItems', function() {
    var instance = instanceWithoutOptions();

    beforeEach(async function() {
      this.mockData = await getMockData();
    });

    describe('ingredient', function() {
      it('removes items with matching ingredients', function() {
        var itemOne = removedProp(this.mockData, 'alcohol');
        var itemTwo = removedProp(this.mockData, 'beef');
        var items = instance.excludeItems(this.mockData, 'alcohol');
        items = instance.excludeItems(items, 'beef');
        assert.equal(items.includes(itemOne), false);
        assert.equal(items.includes(itemTwo), false);
      });
    });

    describe('menuType', function() {
      it('excludes type Halal', function() {
        var halalDish = this.mockData.filter(item => item.menuType === 'Halal')[0];
        var items = instance.excludeItems(this.mockData, 'halal');
        assert.equal(items.includes(halalDish), false);
      });
    });
  });

  describe('fetchMenu', function() {
    after(function() {
      fetchSandbox.restore();
    });

    describe('successful request', function() {
      it('calls API with date param', function() {
        var date = '20030630';
        var apiUrl = 'http://rakuten-towerman.azurewebsites.net/towerman-restapi/rest/cafeteria/menulist?menuDate=';
        fetchSandbox.mock(apiUrl + date, { result: 'SUCCESS' });
        var instance = instanceWithOptions({ date });
        var displayMock = sinon.stub(instance, 'displayMenu').callsFake(() => true);

        instance.fetchMenu();
        var lastUrl = fetchSandbox.lastUrl();
        assert.equal(lastUrl.endsWith(`menuDate=${date}`), true);
      });
    });
  });

  describe('getDate', function() {
    describe('without date option', function() {
      var instance = instanceWithoutOptions();

      describe('unformatted', function() {
        it('should return unformatted date string', function() {
          assert.equal(!!instance.getDate().match(/\d{8}/), true);
        });
      });

      describe('formatted', function() {
        it('should return formatted date string', function() {
          assert.equal(!!instance.getDate(true).match(/\d{4}\\\d{2}\\\d{2}/), true);
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
          assert.notDeepEqual(instance.getDate(true), '1996\01\01');
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
    after(function() {
      sinon.stub.reset();
    });

    it('should read the help file and print it to console', function() {
      var helpText = "HELP FILE CONTENT";
      var instance = instanceWithOptions();
      var fsStub = sinon.stub(fs, 'readFileSync').callsFake(() => helpText);
      var logStub = sinon.stub(instance, 'log').callsFake(() => true);

      instance.help();
      sinon.assert.calledOnce(fsStub);
      assert(logStub.calledWith(helpText));
    });
  });

  describe('isOptionSet', function() {
    it('returns wheter options is set or not', function() {
      var instance = instanceWithOptions({
        testOption: true,
        'another-option': 'some value'
      });
      assert.equal(instance.isOptionSet('testOption'), true);
      assert.equal(instance.isOptionSet('another-option'), true);
      assert.equal(instance.isOptionSet('unsetOption'), false);
    });
  });
});
