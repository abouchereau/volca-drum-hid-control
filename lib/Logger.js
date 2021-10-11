const Utils = require("./Utils");
const clc = require('cli-color');

module.exports = class Logger {
    tab = [];
    paddingLeft = 0;

    clear() {
        process.stdout.write(clc.reset);
    }

    logPart(part, conf, midiCCValues, ccs) {
        this.tab = [];
        this.tab.push([clc.bgWhite.black("PART"),clc.bgWhite.black(part+1)]);
        let maxCharCol = [0,0,0];
        let i =0;
        for(let item in conf) {
            let value = midiCCValues[part][ccs[conf[item]['cmd']]];
            this.tab.push([item,conf[item]['cmd'], value, value]);
            maxCharCol[0] = Math.max(maxCharCol[0],item.length);
            maxCharCol[1] = Math.max(maxCharCol[1],conf[item]['cmd'].length);
            maxCharCol[2] = Math.max(maxCharCol[2],String(value).length);
            process.stdout.write(clc.move.to(0,i++));
            process.stdout.write(clc.erase.line);
        }
        this.paddingLeft = 3*maxCharCol.length + maxCharCol.reduce((a, b) => a + b, 0);

        process.stdout.write(clc.move.to(0,0));
        process.stdout.write(clc.columns(this.tab));
    }


    logMidi(part, cmd, val) {
        let lineNb = 0;
        for(let i in this.tab) {
            if (this.tab[i][1]==cmd) {
                lineNb = i;
                break;
            }
        }
        if (lineNb!=0) {
            process.stdout.write(clc.move.to(this.paddingLeft,lineNb));
            process.stdout.write((val+"       ").substr(0,7));
        }
    }
}


