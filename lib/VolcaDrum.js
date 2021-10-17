const Logger = require("./Logger");
const Utils = require("./Utils");
const MidiNode = require("./MidiNode");
const fs = require('fs');

module.exports = class VolcaDrum {

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
    ccsKey = [];
    currentPattern = 0;
    fxPart = [false,false,false,false];
    currentFx = 0;
    midiCCValues = [[],[],[],[],[],[]];
    levelMemory = [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
    settings = [];
    settingKey = 0;
    logger = null;
    midiNode = null;
    partsControl = [];
    partsControlKey = 0;

    constructor(midiNode) {
        this.midiNode = midiNode;
        this.logger = new Logger(true, true);
        this.ccsInv = Utils.objFlip(this.ccs);
        let i = 0;
        for(let index in this.ccs) {
            this.ccsKey.push(index);
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

    incrementCurrentPart(nb) {
        this.partsControlKey += nb;
        if(this.partsControlKey > this.partsControl.length-1) {
            this.partsControlKey = this.partsControl.length-1;
        }
        if(this.partsControlKey < 0) {
            this.partsControlKey = 0;
        }
        this.onPartChange();
    }

    get currentPart() {//from 0 to 5
        return parseInt(this.partsControl[this.partsControlKey])-1;
    }

    get currentSetting() {
        return this.settings[this.settingKey];
    }

    get currentControl() {
        return this.currentSetting["control"][String(this.currentPart+1)];
    }

    onPartChange() {
        this.logger.logPart(this.currentPart, this.currentControl, this.midiCCValues, this.ccsColName);
    }

    onSettingChange() {
        for(let i = 1; i<=6; i++) {
            this.initPartFromSettings(i);
        }
        this.partsControl = Object.keys(this.currentSetting["control"]);
        this.partsControlKey = 0;
        //initialisation currentPart

        if (this.currentSetting['currentPattern'] != null) {
            this.currentPattern = this.currentSetting['currentPattern'];
            this.onPatternChange();
        }
        this.logger.logPart(this.currentPart, this.currentControl, this.midiCCValues, this.ccsColName);
    }

    initPartFromSettings(i) {
        //console.log("initPartFromSettings",i);
        if (this.currentSetting['part'][String(i)] != null) {
            for(let cmd of this.currentSetting['part'][String(i)]) {
                this.sendMidi([(16 * MidiNode.CC) + (i-1), cmd[1], cmd[2]]);
            }
        }
        //console.log("Midi CC Values",this.midiCCValues);
    }

    onPatternChange () {
        this.sendMidi([MidiNode.PC * 16 + 0, this.currentPattern])
    }


    noteOn(part) {
        let velocity = 50;
        let noteDefault = 60;
        let isMute = this.isMute(part);
        if (isMute) {
           this.muteUnMute(part);
        }
        this.sendMidi([MidiNode.NOTE_ON * 16 + part, noteDefault, velocity]);
        if (isMute) {
            setTimeout(() => {
                this.muteUnMute(part);
            },300);
        }
    }

    pan(part,val) {
        this.sendMidi([MidiNode.CC * 16 + part, this.ccs["PAN"], val]);
    }

    sendMidi(cmd) {
        this.midiNode.send(cmd);
        if (cmd[0] >> 4 == MidiNode.CC) {
            let part = cmd[0] & 0xF;
            let col = this.ccsCol[cmd[1]];
            let val = cmd[2];
            this.midiCCValues[part][col] = val;
            this.logger.logMidi(part,this.ccsKey[col],val,cmd);
        }
    }

    muteUnMute(paramPart ) {
        let part = paramPart;
        if (this.isMute(paramPart)) {
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

    isMute(part) {
        return this.midiCCValues[part][3] == 0 && this.midiCCValues[part][4] == 0;
    }
}