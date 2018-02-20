const pad = require('pad');

module.exports = {
  countObjectValues(obj) {
    return Object.keys(obj).reduce((count, o) => {
      return count + Object.keys(obj[o]).length;
    }, 0);
  },
  formatDate(date) {
    const [all, year, month, day] = /^(\d{4})(\d{2})(\d{2})$/.exec(date);
    return `${year}/${month}/${day}`;
  },
  longestValue(arr) {
    return (arr.reduce((a, b) => {
      return a.length > b.length ? a : b;
    }, '')).length;
  },
  makeDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = pad(2, now.getMonth() + 1, '0');
    const day = pad(2, now.getDate(), '0');

    return `${year}${month}${day}`;
  }
};
