const Utils = require("./Utils");
const clc = require('cli-color');

module.exports = class Logger {
    tab = [];
    paddingLeft = 0;

    initFromSetting(conf, midiCCValues, ccs) {
        this.tab = [];
        let maxCharCol = [0,0,0,0];
        for(let item in conf) {
            let part = conf[item]['part']-1;
            let value = midiCCValues[part][ccs[conf[item]['cmd']]];
            this.tab.push([item,part+1,conf[item]['cmd'], value, value]);
            maxCharCol[0] = Math.max(maxCharCol[0],item.length);
            maxCharCol[1] = Math.max(maxCharCol[1],String(part+1,).length);
            maxCharCol[2] = Math.max(maxCharCol[2],conf[item]['cmd'].length);
            maxCharCol[3] = Math.max(maxCharCol[3],String(value).length);
        }
        this.paddingLeft = 3*maxCharCol.length + maxCharCol.reduce((a, b) => a + b, 0);

        process.stdout.write(clc.reset);
        process.stdout.write(clc.columns(this.tab));
    }

    logMidi(part, cmd, val) {
        let lineNb = 0;
        for(let i in this.tab) {
            if (this.tab[i][1] == part+1 && this.tab[i][2]==cmd) {//todo debug
                lineNb = i;
                break;
            }
        }
       process.stdout.write(clc.move.to(this.paddingLeft,lineNb));
        process.stdout.write((val+"  ").substr(0,3));
        process.stdout.write(clc.move.bottom);
        process.stdout.write(clc.move.lineBegin);
    }
}


