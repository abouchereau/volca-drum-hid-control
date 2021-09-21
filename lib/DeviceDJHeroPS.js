const InputDevice = require("./InputDevice");

module.exports =  class DeviceDJHeroPS extends InputDevice {

    lastFader = 0;
    discValues = {};
    discKeys = {
        "BLUE": "SQUARE",
        "GREEN": "CROSS",
        "RED": "CIRCLE"
    };
    DISC_FACTOR = 0.25;

    constructor(a) {
        super(a);
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
        if (a == "TRIANGLE") {
            this.volca.sendMidi([MidiNode.NOTE_ON * 16 + this.volca.currentPart, 60, 64])
        }
        else if (a == "SELECT") {
            this.volca.muteUnMute();
        }
        else if (a == "PLAYSTATION") {
            if (!this.volca.fxPart[this.volca.currentPart]) {
                let fx = this.volca.settings[this.volca.settingKey]["fx"][String(this.volca.currentFx)];
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
            this.volca.fxPart[this.volca.currentPart] = !this.volca.fxPart[this.volca.currentPart];

        }
        else if (a == "START") {
            this.volca.initPartFromSettings(this.volca.currentPart+1);
        }
        else if (["UP","DOWN"].includes(a)) {
            if (a == "UP") {
                this.volca.currentLayer = 2;
            }
            if (a == "DOWN") {
                this.volca. currentLayer = 1;
            }
            this.volca.onLayerChange();
        }
        else if (["LEFT","RIGHT"].includes(a)) {
            if (this.keyPressed["TRIANGLE"]) {
                if (a == "RIGHT") {
                    this.volca.currentPattern++;
                }
                if (a == "LEFT") {
                    this.volca.currentPattern--;
                }
                this.volca.currentPattern = Utils.mod(this.volca.currentPattern, 16);
                this.volca.onPatternChange();
            }
            else {
                if (a == "RIGHT") {
                    this.volca.incrementCurrentPart(1);
                }
                if (a == "LEFT") {
                    this.volca.incrementCurrentPart(-1);
                }
            }
        }
    }

    onRelease(a) {
        super.onRelease(a);
        if (a == "TRIANGLE") {
            this.volca.sendMidi([MidiNode.NOTE_OFF * 16 + this.volca.currentPart,  60, 100])
        }
    }

    onFaderChange(a) {
        if(Math.abs(a-this.volca.lastFader)<9) {//éviter les "tremblements" de valeurs du fader
            return;
        }
        this.lastFader = a;
        let midiValue = Math.floor(a / 8);
        let hasKeyPressed = false;
        for (let btn of ["SQUARE", "CIRCLE", "CROSS"]) {
            if (this.keyPressed[btn] && this.volca.settings[this.volca.settingKey]['key']["FADER_" + btn] != null) {
                hasKeyPressed = true;
                for (let each of this.volca.settings[this.volca.settingKey]['key']["FADER_" + btn]) {
                    if (this.volca.paramsLayer.includes(each)) {
                        each += this.volca.currentLayer;
                    }
                    this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs[each], midiValue]);
                }
            }
        }
        if (!hasKeyPressed) {
            for (let each of this.volca.settings[this.volca.settingKey]['key']["FADER_ONLY"]) {
                if (this.volca.paramsLayer.includes(each)) {
                    each += this.volca.currentLayer;
                }
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs[each], midiValue]);
            }
        }
    }

    onDiscChange(a) {
        let hasKeyPressed = false;
        for (let btn of ["BLUE", "RED", "GREEN"]) {
            if (this.keyPressed[this.discKeys[btn]] && this.volca.settings[this.volca.settingKey]['key']["DISC_" + btn] != null) {
                hasKeyPressed = true;
                for (let each of this.volca.settings[this.volca.settingKey]['key']["DISC_" + btn]) {
                    if (this.volca.paramsLayer.includes(each)) {
                        each += this.volca.currentLayer;
                    }
                    if (this.discValues[this.volca.currentPart] == null) {
                        this.discValues[this.volca.currentPart] = {};
                    }
                    if (this.discValues[this.volca.currentPart][each] == null) {
                        this.discValues[this.volca.currentPart][each] = this.volca.midiCCValues[this.volca.currentPart][this.volca.ccsColName[each]];
                    }
                    this.discValues[this.volca.currentPart][each] += a * this.DISC_FACTOR;
                    if ( this.discValues[this.volca.currentPart][each]   > 127) {
                        this.discValues[this.volca.currentPart][each]   = 127;
                    }
                    if (this.discValues[this.volca.currentPart][each]   < 0) {
                        this.discValues[this.volca.currentPart][each]   = 0;
                    }
                    let midiValue = Math.round( this.discValues[this.volca.currentPart][each]);


                    this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs[each], midiValue])
                }
            }
        }
        if (!hasKeyPressed) {
            for (let each of this.volca.settings[this.volca.settingKey]['key']["DISC_ONLY"]) {
                if (this.volca.paramsLayer.includes(each)) {
                    each += this.volca.currentLayer;
                }
                if (this.discValues[this.volca.currentPart] == null) {
                    this.discValues[this.volca.currentPart] = {};
                }
                if (this.discValues[this.volca.currentPart][each] == null) {
                    this.discValues[this.volca.currentPart][each] = this.volca.midiCCValues[this.volca.currentPart+1][this.volca.ccsColName[each]];
                }
                this.discValues[this.volca.currentPart][each] += a * this.DISC_FACTOR;
                if (this.discValues[this.volca.currentPart][each]   > 127) {
                    this.discValues[this.volca.currentPart][each]   = 127;
                }
                if (this.discValues[this.volca.currentPart][each]   < 0) {
                    this.discValues[this.volca.currentPart][each]   = 0;
                }


                let midiValue = Math.round(this.discValues[this.volca.currentPart][each]);
                this.volca.sendMidi([MidiNode.CC * 16 + this.volca.currentPart, this.volca.ccs[each], midiValue])
            }
        }
    }

    onKnobChange(a) {//values = 0,1,2,3
        this.volca.currentFx = String(a);
    }
}
