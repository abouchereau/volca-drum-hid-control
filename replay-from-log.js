const fs = require('fs');
const MidiNode = require("./MidiNode");
const Utils = require("./Utils");
const readline = require('readline');

const LOG_DIRECTORY = './log';

let myArgs = process.argv.slice(2);
let filename = myArgs[0];
let logTxt = "";
let logTab = [];


readInterface.on('line', function(line) {
    console.log(line);
});

const readInterface = readline.createInterface({
    input: fs.createReadStream(LOG_DIRECTORY+"/"+filename),
    output: process.stdout,
    console: false
});



