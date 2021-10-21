const Utils = require("./Utils");
const clc = require('cli-color');
const fs = require('fs');
const MidiNode = require("./MidiNode");

module.exports = class Logger {

    LOG_DIRECTORY = './log';
    logFileName = "";
    tab = [];
    paddingLeft = 0;
    logToFile = true;
    logToScreen = true;
    sessionTimeStart = 0;

    USER_ID=1000;
    GROUP_ID=1000;

    constructor(logToFile=true, logToScreen=true) {
        this.logToFile = logToFile;
        this.logToScreen = logToScreen;
        if (this.logToFile) {
            this.createLogDirectory();
            this.createLogSessionFile();
        }
    }

    createLogDirectory() {
        if (!fs.existsSync(this.LOG_DIRECTORY)){
            fs.mkdirSync(this.LOG_DIRECTORY);
            fs.chownSync(this.LOG_DIRECTORY,this.USER_ID,this.GROUP_ID);
        }
    }

    createLogSessionFile() {
        this.sessionTimeStart = Date.now();
        this.logFileName = "session_"+Utils.getFormattedDate(this.sessionTimeStart)+".log";
        fs.writeFileSync(this.LOG_DIRECTORY+"/"+this.logFileName, '');
        fs.chownSync(this.LOG_DIRECTORY+"/"+this.logFileName,this.USER_ID,this.GROUP_ID);
    }

    clear() {
        if (this.logToScreen) {
            process.stdout.write(clc.reset);
        }
    }

    logPart(part, conf, midiCCValues, ccs) {
        if (this.logToScreen) {
            this.tab = [];
            this.tab.push([clc.bgWhite.black("PART"), clc.bgWhite.black(part + 1)]);
            let maxCharCol = [0, 0, 0];
            let i = 0;
            for (let item in conf) {
                let value = midiCCValues[part][ccs[conf[item]['cmd']]];
                this.tab.push([item, conf[item]['cmd'], value, value]);
                maxCharCol[0] = Math.max(maxCharCol[0], item.length);
                maxCharCol[1] = Math.max(maxCharCol[1], conf[item]['cmd'].length);
                maxCharCol[2] = Math.max(maxCharCol[2], String(value).length);
                process.stdout.write(clc.move.to(0, i++));
                process.stdout.write(clc.erase.line);
            }
            this.paddingLeft = 3 * maxCharCol.length + maxCharCol.reduce((a, b) => a + b, 0);

            process.stdout.write(clc.move.to(0, 0));
            process.stdout.write(clc.columns(this.tab));
        }
    }


    logMidi(part, cmd, val, midiCmd) {
        let isCC = midiCmd[0] >> 4 == MidiNode.CC;

        if (isCC && this.logToScreen) {
            let lineNb = 0;
            for (let i in this.tab) {
                if (this.tab[i][1] == cmd) {
                    lineNb = i;
                    break;
                }
            }
            if (lineNb != 0) {
                process.stdout.write(clc.move.to(this.paddingLeft, lineNb));
                process.stdout.write((val + "       ").substr(0, 7));
            }
        }
        if (this.logToFile) {
            let lineTxt = (Date.now()-this.sessionTimeStart)+";";
            for(let val of midiCmd) {
                lineTxt += Utils.hexVal(val);
            }
            lineTxt += "\n";
            fs.appendFile(this.LOG_DIRECTORY+"/"+this.logFileName, lineTxt,(e)=>{});
        }
    }
}


