const Utils = require("./Utils");
const clc = require('cli-color');

module.exports = class Logger {
    loggerTab = [[clc.bold("PART"),clc.bold("LAY")],[]];
    volca = null;

    constructor(volca) {
        this.volca = volca;
        for (let cc in this.volca.ccs) {
            this.loggerTab[0].push(cc);
        }
    }

    logAllMidi() {
        this.loggerTab[1] = [];
        this.loggerTab[1][0] = clc.bold(this.volca.currentPart);
        this.loggerTab[1][1] = clc.bold(this.volca.currentLayer);
        for (let value of this.volca.midiCCValues[this.volca.currentPart]) {
            this.loggerTab[1].push(value);
        }
        let tab = Utils.inverseMatrix(this.loggerTab);
        process.stdout.write(clc.reset);
        process.stdout.write(clc.columns(tab));
    }

    logMidi(col, val) {
        process.stdout.write(clc.move.to(8,col+2));
        process.stdout.write(clc.black.bgWhite((val+"  ").substr(0,3)));
        process.stdout.write(clc.move.bottom);
        process.stdout.write(clc.move.lineBegin);
    }
}


