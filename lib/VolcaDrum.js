const Logger = require("./Logger");
const Utils = require("./Utils");
const MidiNode = require("./MidiNode");
const fs = require('fs');

module.exports = class VolcaDrum {

    //paramsLayer= ["SEL","LEV","ATT","REL","PIT","AMT","RATE"];
    ccs = {
        "PAN": 10,
        "SEL1":14,
        "SEL2":15,
        "LEV1":17,
        "LEV2":18,
        "ATT1":20,
        "ATT2":21,
        "REL1":23,
        "REL2":24,
        "PIT1":26,
        "PIT2":27,
        "AMT1":29,
        "AMT2":30,
        "RATE1":46,
        "RATE2":47,
        "BIT":49,
        "FLD":50,
        "DRV":51,
        "GAN":52,
        "QPI":53,
        "SEND":103,
        "WAVE":116,
        "DECAY":117,
        "BODY":118,
        "TUNE":119,
    };
    ccsInv = {};
    ccsCol = {};
    ccsColName = {};
    //currentPart = 0;
    currentPattern = 0;
    //currentLayer = 1;
    fxPart = [false,false,false,false,false,false];
    currentFx = 0;
    midiCCValues = [[],[],[],[],[],[]];
    levelMemory = [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
    settings = [];
    settingKey = 0;
    logger = null;
    midiNode = null;

    constructor(midiNode) {
        this.midiNode = midiNode;
        this.logger = new Logger(this);
        this.ccsInv = Utils.objFlip(this.ccs);
        let i = 0;
        for(let index in this.ccs) {
            this.ccsCol[this.ccs[index]] = i;
            this.ccsColName[index] = i++;
            for (let j=0;j<6;j++) {
                this.midiCCValues[j].push(0);
            }
        }
        this.loadSettings();
    }

    loadSettings() {
        try {
            this.settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
        } catch (err) {
            console.error(err);
            process.exit();
        }
    }
/*
    incrementCurrentPart(nb) {
        this.currentPart += nb;
        if(this.currentPart>5) {
            this.currentPart = 5;
        }
        if(this.currentPart<0) {
            this.currentPart = 0;
        }
        this.onPartChange();
    }

    onPartChange() {
        this.logger.logAllMidi();
    }
*/
    onSettingChange() {
        for(let i = 1; i<=6; i++) {
            this.initPartFromSettings(i);
        }
        //initialisation currentPart
      /*  if (this.settings[this.settingKey]['currentPart'] != null) {
            this.currentPart = this.settings[this.settingKey]['currentPart'];
            this.onPartChange();
        }*/
        if (this.settings[this.settingKey]['currentPattern'] != null) {
            this.currentPattern = this.settings[this.settingKey]['currentPattern'];
            this.onPatternChange();
        }
        this.logger.initFromSetting(this.settings[this.settingKey]['key'],this.midiCCValues, this.ccs);
    }

    initPartFromSettings(i) {
        //console.log("initPartFromSettings",i);
        if (this.settings[this.settingKey]['part'][String(i)] != null) {
            for(let cmd of this.settings[this.settingKey]['part'][String(i)]) {
                this.sendMidi([(16 * MidiNode.CC) + (i-1), cmd[1], cmd[2]]);
            }
        }
    }

    onPatternChange () {
        this.sendMidi([MidiNode.PC * 16 + 0, this.currentPattern])
    }
/*
    onLayerChange() {
        this.logger.logAllMidi();
    }

    onPartChange () {
        this.logger.logAllMidi();
    }
*/

    sendMidi(cmd) {
        this.midiNode.send(cmd);
        if (cmd[0] >> 4 == MidiNode.CC) {
            let part = cmd[0] & 0xF;
            let col = this.ccsCol[cmd[1]];
            let val = cmd[2];
            this.midiCCValues[part][col] = val;
            this.logger.logMidi(part,this.ccsInv[cmd[1]],val);
        }
    }

    muteUnMute(paramPart ) {
        let part = paramPart;
        if (this.midiCCValues[part][3] == 0 && this.midiCCValues[part][4] == 0) {
            //unmute
            this.sendMidi([(16 * MidiNode.CC) + part, this.ccs["LEV1"], this.levelMemory[part][0]]);
            this.sendMidi([(16 * MidiNode.CC) + part, this.ccs["LEV2"], this.levelMemory[part][1]]);
        }
        else {
            //mute
            this.levelMemory[part][0] = this.midiCCValues[part][3];
            this.levelMemory[part][1] = this.midiCCValues[part][4];
            this.sendMidi([(16 * MidiNode.CC) + part, this.ccs["LEV1"], 0]);
            this.sendMidi([(16 * MidiNode.CC) + part, this.ccs["LEV2"], 0]);
        }
    }
}