module.exports = {
  countObjectValues(obj) {
    return Object.keys(obj).reduce((count, o) => {
      return count + Object.keys(obj[o]).length;
    }, 0);
  },
  longestValue(arr) {
    return (arr.reduce((a, b) => {
      return a.length > b.length ? a : b;
    }, '')).length;
  }
};
