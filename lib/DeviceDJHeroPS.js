const InputDevice = require("./InputDevice");
const Utils = require("./Utils");
const MidiNode = require("./MidiNode");

module.exports =  class DeviceDJHeroPS extends InputDevice {

    lastFader = 0;
    discValues = {};
    discKeys = {
        "BLUE": "SQUARE",
        "GREEN": "CROSS",
        "RED": "CIRCLE"
    };
    DISC_FACTOR = 0.5;

    constructor(a,b) {
        super(a,b);
        this.VENDOR_ID = 4794;
        this.PRODUCT_ID = 320;
        this.name = "DJ Hero";
        this.mappingWatchBytes = [0,1,2,6,20,21];
        this.keyPressed = {
            "PLAYSTATION": false,
            "START": false,
            "SELECT": false,
            "UP": false,
            "DOWN": false,
            "LEFT": false,
            "RIGHT": false,
            "SQUARE": false,//==bleu
            "TRIANGLE": false,// == gros bouton
            "CIRCLE": false,//==rouge
            "CROSS": false,//==vert
        };
    }

    mapping(key, value) {
        //boutons
        let newKeyPressed = {};
        if (key == 0) {
            newKeyPressed["SQUARE"] = false;
            newKeyPressed["CROSS"] = false;
            newKeyPressed["CIRCLE"] = false;
            newKeyPressed["TRIANGLE"] = false;
            if ((value >> 0 & 0x1) == 1) {
                newKeyPressed["SQUARE"] = true;
            }
            if ((value >> 1 & 0x1) == 1) {
                newKeyPressed["CROSS"] = true;
            }
            if ((value >> 2 & 0x1) == 1) {
                newKeyPressed["CIRCLE"] = true;
            }
            if ((value >> 3 & 0x1) == 1) {
                newKeyPressed["TRIANGLE"] = true;
            }
        }
        if (key == 1) {
            newKeyPressed["START"] = false;
            newKeyPressed["SELECT"] = false;
            newKeyPressed["PLAYSTATION"] = false;
            if ((value >> 0 & 0x1) == 1) {
                newKeyPressed["SELECT"] = true;
            }
            if ((value >> 1 & 0x1) == 1) {
                newKeyPressed["START"] = true;
            }
            if ((value >> 4 & 0x1) == 1) {
                newKeyPressed["PLAYSTATION"] = true;
            }
        }
        if (key==2) {
            newKeyPressed["UP"] = false;
            newKeyPressed["DOWN"] = false;
            newKeyPressed["LEFT"] = false;
            newKeyPressed["RIGHT"] = false;
            switch (value) {
                case 15: break;
                case 0: newKeyPressed["UP"] = true; break
                case 4: newKeyPressed["DOWN"] = true; break
                case 6: newKeyPressed["LEFT"] = true; break
                case 2: newKeyPressed["RIGHT"] = true; break
                case 7: newKeyPressed["UP"] = true; newKeyPressed["LEFT"] = true; break
                case 1: newKeyPressed["UP"] = true; newKeyPressed["RIGHT"] = true; break
                case 5: newKeyPressed["DOWN"] = true; newKeyPressed["LEFT"] = true; break
                case 3: newKeyPressed["DOWN"] = true; newKeyPressed["RIGHT"] = true; break
            }
        }
        for (let key in newKeyPressed) {
            if (newKeyPressed[key] != this.keyPressed[key]) {
                this.keyPressed[key] = newKeyPressed[key];
                if (this.keyPressed[key]) {
                    this.onPress(key);
                }
                else {
                    this.onRelease(key);
                }
            }
        }
        //analogiques
        if (key==21) {
            this.onFaderChange(this.tab[22]*256+value);
        }
        if (key==6) {
            this.onDiscChange(-1*(128-value));
        }
        if (key==20) {
            this.onKnobChange(value);
        }
    }

    onPress(a) {
        super.onPress(a);
        let mustSendParent = true;
        if (a == "TRIANGLE") {
            //this.volca.sendMidi([MidiNode.NOTE_ON * 16 + this.volca.currentPart, 60, 64])
        }
        else if (a == "SELECT") {
            this.volca.muteUnMute();
        }
        else if (a == "PLAYSTATION") {
            let fx = this.volca.currentSetting["fx"][String(this.volca.currentFx)];
            if (!this.volca.fxPart[this.volca.currentFx]) {
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs["WAVE"], fx['WAVE']]);
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs["SEND"], fx['SEND']]);
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs["DECAY"], fx['DECAY']]);
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs["TUNE"], fx['TUNE']]);
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs["BODY"], fx['BODY']]);
            }
            else {
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs["WAVE"], 0]);
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs["SEND"], 0]);
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs["DECAY"], 0]);
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs["TUNE"], 0]);
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs["BODY"], 0]);
            }
            this.volca.fxPart[this.volca.currentFx] = !this.volca.fxPart[this.volca.currentFx];

        }
        else if (a == "START") {
            this.volca.initPartFromSettings(this.volca.currentPart+1);
        }
        else if (["UP","DOWN"].includes(a)) {
            if (a == "UP") {
               // this.volca.currentLayer = 2;
            }
            if (a == "DOWN") {
                //this.volca. currentLayer = 1;
            }
            //this.volca.onLayerChange();
        }
        else if (["LEFT","RIGHT"].includes(a)) {
            if (a == "RIGHT") {
                this.volca.incrementCurrentPart(1);
            }
            if (a == "LEFT") {
                this.volca.incrementCurrentPart(-1);
            }
        }
        else {
            mustSendParent = false;
        }
        if (mustSendParent) {
            this.sendParent();
        }

    }

    onRelease(a) {
        super.onRelease(a);
        if (a == "TRIANGLE") {
            this.volca.sendMidi([MidiNode.NOTE_OFF * 16 + this.volca.currentPart,  60, 100])
        }
    }

    onFaderChange(a) {
        if(Math.abs(a-this.lastFader)<9) {//éviter les "tremblements" de valeurs du fader
            return;
        }
        this.lastFader = a;

        let hasKeyPressed = false;
        for (let btn of ["SQUARE", "CIRCLE", "CROSS"]) {
            if (this.keyPressed[btn] && this.volca.currentControl["FADER_" + btn] != null) {
                hasKeyPressed = true;
                let settingObj = this.volca.currentControl["FADER_" + btn];
                let cmd = settingObj['cmd'];
                let midiValue = this.computeMidiValueFader(a, settingObj);
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs[cmd], midiValue]);
            }
        }
        if (!hasKeyPressed) {
            let settingObj = this.volca.currentControl["FADER_ONLY"];
            let cmd = settingObj['cmd'];
            let midiValue = this.computeMidiValueFader(a, settingObj);
            this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs[cmd], midiValue]);
        }
        this.sendParent();
    }

    onDiscChange(a) {
        let hasKeyPressed = false;
        for (let btn of ["BLUE", "RED", "GREEN"]) {
            if (this.keyPressed[this.discKeys[btn]] && this.volca.currentControl["DISC_" + btn] != null) {
                hasKeyPressed = true;
                let settingObj = this.volca.currentControl["DISC_" + btn];
                let cmd = settingObj['cmd'];
                let midiValue = this.computeMidiValueDisc(a, settingObj);
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs[cmd], midiValue]);
            }
        }
        if (!hasKeyPressed) {
            let settingObj = this.volca.currentControl["DISC_ONLY"];
            let cmd = settingObj['cmd'];
            let midiValue = this.computeMidiValueDisc(a, settingObj);
            this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs[cmd], midiValue]);
        }
        this.sendParent();
    }

    computeMidiValueDisc(a, settingObj) {
        let cmd = settingObj['cmd'];
        let part = this.volca.currentPart;
        let min = 0;
        let max = 127;
        if (settingObj['min'] != null && settingObj['min'] > 0) {
            min = settingObj['min']
        }
        if (settingObj['max'] != null && settingObj['max'] <127) {
            max = settingObj['max']
        }
        if (this.discValues[part] == null) {
            this.discValues[part] = {};
        }
        if (this.discValues[part][cmd] == null) {
            this.discValues[part][cmd] = this.volca.midiCCValues[part][this.volca.ccsColName[cmd]];
        }
        let gapFactor = (max - min)/127;
        this.discValues[part][cmd] += a * this.DISC_FACTOR * gapFactor;
        if ( this.discValues[part][cmd] > max) {
            this.discValues[part][cmd] = max;
        }
        if (this.discValues[part][cmd] < min) {
            this.discValues[part][cmd] = min;
        }
        return Math.round(this.discValues[part][cmd]);
    }

    computeMidiValueFader(a, settingObj) {
        let min = 0;
        let max = 127;
        if (settingObj['min'] != null) {
            min = settingObj['min']
        }
        if (settingObj['max'] != null) {
            max = settingObj['max']
        }
        return Math.floor(Utils.transposeValue(a/8, 0, 127, min, max));
    }

    onKnobChange(a) {//values = 0,1,2,3
        this.volca.currentFx = String(a);
    }
}
