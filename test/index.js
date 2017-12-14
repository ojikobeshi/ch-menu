var assert = require('assert');
var fs = require('fs');
var proxyquire = require('proxyquire');
var fetchMock = require('fetch-mock');
var sinon = require('sinon');
var fetchSandbox = fetchMock.sandbox();
// var CrimsonHouseMenu = require('../lib/index');
var CrimsonHouseMenu = proxyquire('../lib/index', {
  'node-fetch': fetchSandbox
});

function instanceWithOptions(options) {
  return new CrimsonHouseMenu(options);
}

function instanceWithoutOptions() {
  return new CrimsonHouseMenu({});
}

describe('CrimsonHouseMenue', function() {
  // To be implemented
  describe('displayMenu', function() {});
  describe('excludeItems', function() {});
  describe('filterAndSortItems', function() {});
  describe('formatDate', function() {});
  describe('isOptionSet', function() {});
  describe('makeDate', function() {});
  describe('print', function() {});

  describe('fetchMenu', function() {
    after(function() {
      fetchMock.restore();
    });

    describe('successful request', function() {
      it('calls API with date param', function() {
        var date = '20030630';
        var apiUrl = 'http://rakuten-towerman.azurewebsites.net/towerman-restapi/rest/cafeteria/menulist?menuDate=';
        fetchSandbox.mock('*', { result: 'SUCCESS' });
        var instance = instanceWithOptions({ date });

        var displayMock = sinon.stub(instance, 'displayMenu').callsFake(function() {
          return true;
        });

        var res = instance.fetchMenu();
        var lastUrl = fetchSandbox.lastUrl();
        assert.equal(lastUrl.endsWith(`menuDate=${date}`), true);
        sinon.assert.calledOnce(displayMock);
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

  describe('help', function() {
    after(function() {
      sinon.stub.reset();
    });

    it('should read the help file and print it to console', function() {
      var helpText = "HELP FILE CONTENT";
      var fsSpy = sinon.stub(fs, 'readFileSync').callsFake(function() {
        return helpText;
      });
      var instance = instanceWithOptions();

      // TODO: create log method to handle console logging

      instance.help();
      sinon.assert.calledOnce(fsSpy);
    });
  });
});
