const Utils = require("./Utils");
const clc = require('cli-color');

module.exports = class Logger {
    tab = [];

    initFromSetting(conf, midiCCValues, ccs) {
        this.tab = [];
        for(let item in conf) {
            console.log(ccs,conf[item]['cmd']);
            console.log(midiCCValues);
            process.exit();
            let value = midiCCValues[conf[item]['part']][ccs[conf[item]['cmd']]];
            this.tab.push([item,conf[item]['part'],conf[item]['cmd'], value]);
        }
    }

    logMidi(part, cmd, val) {
        let lineNb = 0;
        for(let i in this.tab) {
            if (this.tab[i][1] == part && this.tab[i][2]==cmd) {
                lineNb = i;
                break;
            }
        }
        process.stdout.write(clc.move.to(18,lineNb));
        process.stdout.write((val+"  ").substr(0,3));
        process.stdout.write(clc.move.bottom);
        process.stdout.write(clc.move.lineBegin);
    }
}


