const Utils = require("./Utils");
const clc = require('cli-color');

module.exports = class Logger {
    tab = [];

    initFromSetting(conf, midiCCValues, ccs) {
        this.tab = [];
        for(let item in conf) {
            let part = conf[item]['part']-1;
            let value = midiCCValues[part][ccs[conf[item]['cmd']]];
            this.tab.push([item,part,conf[item]['cmd'], value]);
        }
        process.stdout.write(clc.reset);
        process.stdout.write(clc.columns(this.tab));
    }

    logMidi(part, cmd, val) {
        let lineNb = 0;
       // console.log(part,cmd/*,this.tab*/);
        for(let i in this.tab) {
            if (this.tab[i][1] == part && this.tab[i][2]==cmd) {
                lineNb = i;
                break;
            }
        }
        process.stdout.write(clc.move.to(26,lineNb));
        process.stdout.write((val+"  ").substr(0,3));
        process.stdout.write(clc.move.bottom);
        process.stdout.write(clc.move.lineBegin);
    }
}


