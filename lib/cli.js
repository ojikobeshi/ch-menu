#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const CrimsonHouseMenu = require('./index');

function floorOption(floor) {
  return [9, 22].includes(parseInt(floor))
    ? floor
    : null;
}

function timeOption(time) {
  return ['dinner', 'lunch'].includes(time)
    ? time
    : null;
}

const optionDefinitions = [
  { name: 'date', alias: 'd', type: String },
  { name: 'floor', alias: 'f', type: floorOption },
  { name: 'help', type: Boolean },
  { name: 'show-images', type: Boolean },
  { name: 'time', alias: 't', type: timeOption },
];

const options = commandLineArgs(optionDefinitions, {
  partial: true
});

const lib = new CrimsonHouseMenu(options);

if (options.help === true) {
  return lib.help();
}

lib.fetchMenu();
