// à lancer en root
//connecter d'abord le matériel

const HID = require('node-hid');
const fs = require('fs');
const midi = require('midi');
const readline = require('readline');
const clc = require('cli-color');
const NanoTimer = require('nanotimer');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


class VolcaDrum {

    paramsLayer= ["SEL","LEV","ATT","REL","PIT","AMT","RATE"];
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
    currentPart = 0;
    currentPattern = 0;
    currentLayer = 1;
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

    onSettingChange() {
        for(let i = 1; i<=6; i++) {
            this.initPartFromSettings(i);
        }
        //initialisation currentPart
        if (this.settings[this.settingKey]['currentPart'] != null) {
            this.currentPart = this.settings[this.settingKey]['currentPart'];
            this.onPartChange();
        }
        if (this.settings[this.settingKey]['currentPattern'] != null) {
            this.currentPattern = this.settings[this.settingKey]['currentPattern'];
            this.onPatternChange();
        }
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

    onLayerChange() {
        this.logger.logAllMidi();
    }

    onPartChange () {
        this.logger.logAllMidi();
    }


    sendMidi(cmd) {
        this.midiNode.send(cmd);
        if (cmd[0] >> 4 == MidiNode.CC) {
            let part = cmd[0] & 0xF;
            let col = this.ccsCol[cmd[1]];
            let val = cmd[2];
            this.midiCCValues[part][col] = val;
            this.logger.logMidi(col,val);
        }
    }

     muteUnMute(paramPart = null) {
        let part = paramPart==null?this.currentPart:paramPart;
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



class Utils {

    static objFlip(objIn) {
        return Object.entries(objIn).reduce((obj, [key, value]) => ({ ...obj, [value]: key }), {});
    }

    static mod(n, m) {
        return ((n % m) + m) % m;
    }

    static inverseMatrix(m) {
        return m[0].map((x,i) => m.map(x => x[i]))
    }
}

class InputDevice {//abstract

    name = ""

    VENDOR_ID = 0
    PRODUCT_ID = 0;

    keyPressed = {};//to implement
    device = null;
    mappingWatchBytes = [];
    tab = [];
    tabJson = "";
    prevTab = [];
    prevTabJson = "";//pour comparer
    volca = null;
    connectInterval = null;

    constructor(volca) {
        this.volca = volca;
    }

    init() {
        try {
            this.device = new HID.HID(this.VENDOR_ID,this.PRODUCT_ID);
            console.info(clc.green(":) "+this.name+" connected"));
            this.device.on('data',this.onDataChange.bind(this));
            this.device.on('error',this.onError.bind(this));
        } catch (err) {
            console.info(clc.red(":( "+this.name+" not connected"));
            this.device = null;
        }
    }

    onDataChange(data) {
        this.tab = Array.prototype.slice.call(data);
        this.tabJson = JSON.stringify(this.tab);
        if (this.prevTabJson != this.tabJson) {
            for (let i of this.mappingWatchBytes) {
                if (this.tab[i] != this.prevTab[i]) {
                    this.mapping(i, this.tab[i]);
                }
            }
            this.prevTab = this.tab.slice();
            this.prevTabJson = this.tabJson;
        }
    }

    onError(a) {
        console.log(clc.red(":( "+this.name+" disconnected "+a));
        this.device = null;
        this.connectInterval = setInterval(()=>{
            this.init();
            if (this.device != null) {
                clearInterval(this.connectInterval);
            }
        },1000);
    }

    mapping(key, value) {   //to implement
    }

    onPress() {}

    onRelease() {}
}

class DeviceDJHeroPS extends InputDevice {

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

class DeviceArcadeJoystick extends InputDevice {

    constructor(a) {
        super(a);
        this.name = "Arcade Joystick";
        this.VENDOR_ID = 4797;
        this.PRODUCT_ID = 53281;
        this.mappingWatchBytes = [0,1,2,3];
        this.keyPressed =  {
            "BTN_1": false,
            "BTN_2": false,
            "BTN_3": false,
            "BTN_4": false,
            "BTN_5": false,
            "BTN_6": false,
            "BTN_7": false,
            "BTN_8": false,
            "BTN_9": false,
            "BTN_10": false,
            "BTN_11": false,
            "BTN_12": false,
            "JOY_UP": false,
            "JOY_DOWN": false,
            "JOY_LEFT": false,
            "JOY_RIGHT": false
        };
    }

    mapping(key, value) {
        let newKeyPressed = {};
        if (key == 0) {
            newKeyPressed["JOY_LEFT"] = false;
            newKeyPressed["JOY_RIGHT"] = false;
            if (value == 0) {
                newKeyPressed["JOY_LEFT"] = true;
            }
            if (value == 0xFF) {
                newKeyPressed["JOY_RIGHT"] = true;
            }
        }
        if (key == 1) {
            newKeyPressed["JOY_UP"] = false;
            newKeyPressed["JOY_DOWN"] = false;
            if (value == 0) {
                newKeyPressed["JOY_UP"] = true;
            }
            if (value == 0xFF) {
                newKeyPressed["JOY_DOWN"] = true;
            }
        }

        if (key == 2) {
            for(let i = 1;i<=4;i++) {
                newKeyPressed["BTN_"+i] = false;
            }
            for(let i = 1;i<=4;i++) {
                if ((value >> (i+3) & 0x1) == 1) {
                    newKeyPressed["BTN_"+i] = true;
                }
            }
        }

        if (key == 3) {
            for(let i=5;i<=12;i++) {
                newKeyPressed["BTN_"+i] = false;
            }
            for(let i=0;i<=7;i++) {
                if ((value >> i & 0x1) == 1) {
                    newKeyPressed["BTN_"+(i+5)] = true;
                }
            }
        }

        for (let key in newKeyPressed) {
            if (newKeyPressed[key] != this.keyPressed[key]) {
                this.keyPressed[key] = newKeyPressed[key];
                if (this.keyPressed[key]) {
                    this.onPress(key);
                } else {
                    this.onRelease(key);
                }
            }
        }
    }

    onPress(a) {
        super.onPress(a);
        for(let i = 0; i < 6; i++) {
            if (a== ("BTN_"+(i+1))) {
                this.volca.muteUnMute(i);
            }
        }
    }

}

class MidiNode {
    static get NOTE_OFF() {return 8;}
    static get NOTE_ON() {return 9;}
    static get CC() {return 11;}
    static get PC() {return 2;}

    MIDI_MSG_GAP = "600u";//cf NanoTimer

    DEFAULT_MIDI_INDEX = 0;
    midiOutIndex = 0;
    nbMidiDevices = 0;
    midiOutput = null;
    midiCmdStack = [];
    stackIsEmpty = true;
    timer = null;


    constructor() {
        this.timer = new NanoTimer();
        this.timer.setInterval(() => {
            if (!this.stackIsEmpty) {
                let midiCmd = this.midiCmdStack.shift()
                this.midiOutput.send(midiCmd);
                if (this.midiCmdStack.length == 0) {
                    this.stackIsEmpty = true;
                }
            }
        }, '', this.MIDI_MSG_GAP);

    }

    scanOutput() {
        console.info("Scanning MIDI Outputs...");
        this.midiOutput = new midi.Output();
        this.nbMidiDevices = this.midiOutput.getPortCount();
        if (this.nbMidiDevices == 0) {
            rl.question("No MIDI Output found", a => {
                process.exit();
            });
        }
        for(let i=0;i<this.nbMidiDevices;i++) {
            console.log(i+" : "+this.midiOutput.getPortName(i));
        }
    }

    openOutput() {
        this.midiOutput.openPort(this.midiOutIndex);
    }

    send(cmd) {
        this.midiCmdStack.push(cmd);
        this.stackIsEmpty = false;
    }

}



class Logger {
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






let midiNode = new MidiNode();
midiNode.scanOutput();
let volca = new VolcaDrum(midiNode);

rl.question("=> Choose MIDI Output (default: "+midiNode.DEFAULT_MIDI_INDEX+") : ", paramMidiIndex => {
    midiNode.midiOutIndex = midiNode.DEFAULT_MIDI_INDEX;
    if (paramMidiIndex == null || paramMidiIndex == "" || parseInt(paramMidiIndex) > (midiNode.nbMidiDevices - 1)) {
        rl.question("=> Bad index for MIDI Output", a=>process.exit());
    }
    midiNode.midiOutIndex = parseInt(paramMidiIndex);
    midiNode.openOutput();

    let deviceDJHero = new DeviceDJHeroPS(volca);
    let deviceArcadeJoystick = new DeviceArcadeJoystick(volca);
    deviceDJHero.init();
    deviceArcadeJoystick.init();
    rl.question("=> Go ? ", a => volca.onSettingChange());
});







