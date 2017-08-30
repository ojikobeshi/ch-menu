#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const CrimsonHouseMenu = require('./index');

const optionDefinitions = [
  { name: 'date', alias: 'd', type: String },
  { name: 'floor', alias: 'f', type: Number },
  { name: 'help', type: Boolean },
  { name: 'show-images', type: Boolean },
  { name: 'time', alias: 't', type: String },
];

const options = commandLineArgs(optionDefinitions);

const lib = new CrimsonHouseMenu(options);

if (options.help === true) {
  lib.help();
} else {
  lib.fetchMenu();
}
