var assert = require('assert');
var util = require('../../util/');

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

  describe('longestValue', function() {
    it('returns length of the longest value of array', function() {
      const arr = ['a', 'longest', 'ab'];
      assert.equal(util.longestValue(arr), 7);
      assert.equal(util.longestValue([]), 0);
    });
  });
});
