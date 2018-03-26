const assert = require('assert');
const sinon = require('sinon');
const util = require('../../util/');

describe('utils', function() {
  describe('countObjectValues', function() {
    it('return the accumulated length of objects entries', function() {
      const objOne = {
        a: [1, 2],
        b: [3, 4]
      };
      assert.equal(util.countObjectValues(objOne), 4);
      assert.equal(util.countObjectValues({}), 0);
    });
  });

  describe('formatDate', function() {
    it('returns the date in the format YYYY/MM/DD', function() {
      assert.equal(util.formatDate('20130912'), '2013/09/12');
    });
  });

  describe('longestValue', function() {
    it('returns length of the longest value of array', function() {
      const arr = ['a', 'longest', 'ab'];
      assert.equal(util.longestValue(arr), arr[1].length);
      assert.equal(util.longestValue([]), 0);
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
      assert.equal(util.makeDate(), '20170101');
    });
  });

  describe('terminalSupportsInlineImages', function() {
    it('returns true for supported terminals', function() {
      process.env.TERM_PROGRAM = 'iTerm.app';
      assert.equal(util.terminalSupportsInlineImages(), true)
    });

    it('returns false for unsupported terminals', function() {
      process.env.TERM_PROGRAM = 'not_iTerm';
      assert.equal(util.terminalSupportsInlineImages(), false)
    });
  })
});
