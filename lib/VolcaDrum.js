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
        "PIT12":28,
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
    settingKey = 1;
    logger = null;
    midiNode = null;
    partsControl = [];
    partsControlKey = 0;
    lastCC = [];

    constructor(midiNode, logToFile, logToScreen) {
        this.midiNode = midiNode;
        this.logger = new Logger(logToFile, logToScreen);
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
            this.settings = JSON.parse(fs.readFileSync(__dirname+'/../settings.json', 'utf8'));
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

    incrementCurrentPattern(nb) {
        this.currentPattern += nb;
        if (this.currentPattern > 15) {
            this.currentPattern = 15;
        }
        if (this.currentPattern < 0) {
            this.currentPattern = 0;
        }
        this.onPatternChange();
    }

    incrementSettingKey(nb) {
        this.settingKey += nb;
        if (this.settingKey > this.settings.length -1) {
            this.settingKey = this.settings.length-1;
        }
        if (this.settingKey < 0) {
            this.settingKey = 0;
        }
        this.onSettingChange();
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

        if (this.currentSetting['setPattern'] != null) {
            this.currentPattern = this.currentSetting['setPattern']-1;
            this.onPatternChange();
        }
        if (this.currentSetting['setMuteParts'] != null) {
            for(let part of this.currentSetting['setMuteParts']) {
               // this.mute(part);
            }
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
        this.sendMidi([MidiNode.PC * 16 + 0, this.currentPattern]);
    }


    noteOn(part) {
        console.log("volca.noteOn");
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

    pitch(part, val) {
        console.log("volca.pitch", val);
        this.sendMidi([MidiNode.CC * 16 + part, this.ccs["PIT12"], val]);
    }

    sendMidi(cmd) {
        let isCC = cmd[0] >> 4 == MidiNode.CC;
        if (isCC) {
            if (Utils.arraysEqual(cmd, this.lastCC)) {//avoid CC repetition
                return;
            }
            else {
                this.lastCC = Utils.cloneArray(cmd);
            }
        }
        this.midiNode.send(cmd);
        let part = cmd[0] & 0xF;
        let col = this.ccsCol[cmd[1]];
        let val = cmd[2];
        if (isCC) {
            this.midiCCValues[part][col] = val;
        }
        this.logger.logMidi(part,this.ccsKey[col],val,cmd);

    }

    muteUnMute(part) {
        if (this.isMute(part)) {
            this.unmute(part);
        }
        else {
            this.mute(part);
        }
    }

    mute(part) {
        this.levelMemory[part][0] = this.midiCCValues[part][3];
        this.levelMemory[part][1] = this.midiCCValues[part][4];
        this.sendMidi([(16 * MidiNode.CC) + part, this.ccs["LEV1"], 0]);
        this.sendMidi([(16 * MidiNode.CC) + part, this.ccs["LEV2"], 0]);
    }

    unmute(part) {
        this.sendMidi([(16 * MidiNode.CC) + part, this.ccs["LEV1"], this.levelMemory[part][0]]);
        this.sendMidi([(16 * MidiNode.CC) + part, this.ccs["LEV2"], this.levelMemory[part][1]]);
    }

    isMute(part) {
        return this.midiCCValues[part][3] == 0 && this.midiCCValues[part][4] == 0;
    }
}