const InputDevice = require("./InputDevice");
const clc = require('cli-color');

module.exports = class DeviceArcadeJoystick extends InputDevice {


    keysShort = ["U","D","L","R","1","2","3","4","5","6","7","8","9","A","B","C"];
    keysLog = {};
    static LOG_LINE = 10;

    constructor(a) {
        super(a);

        this.name = "Arcade Joystick";
        this.VENDOR_ID = 4797;
        this.PRODUCT_ID = 53281;

        this.mappingWatchBytes = [0,1,2,3];
        this.keyPressed =  {
            "JOY_UP": false,
            "JOY_DOWN": false,
            "JOY_LEFT": false,
            "JOY_RIGHT": false,
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
            "BTN_12": false
        };
        let i = 0;
        for(let key in this.keyPressed) {
            this.keysLog[key] = [i,this.keysShort[i]];
            i++;
        }
        this.initLog();


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
        for(let i = 6; i < 12; i++) {
            if (a== ("BTN_"+(i+1))) {
                this.volca.noteOn(i-6);
            }
        }
        if (a=="JOY_LEFT") {
            this.volca.pan(this.volca.currentPart,0);
        }
        if (a=="JOY_RIGHT") {
            this.volca.pan(this.volca.currentPart,127);
        }
        if (a=="JOY_UP") {
            this.volca.incrementCurrentPattern(1);
        }
        if (a=="JOY_DOWN") {
            this.volca.incrementCurrentPattern(-1);
        }
        this.logPress(a);
    }

    onRelease(a) {
        super.onRelease();
        if (a=="JOY_LEFT" || a=="JOY_RIGHT") {
            this.volca.pan(this.volca.currentPart,64);
        }
        this.logRelease(a);
    }

    initLog() {
        let line = 10;
        for(let i in this.keysShort) {
            process.stdout.write(clc.move.to(i*2,line));
            process.stdout.write(this.keysShort[i]);
        }
    }

    logPress(a) {
        let col = this.keysLog[a][0]*2;
        let letter = this.keysLog[a][1];
        process.stdout.write(clc.move.to(col,DeviceArcadeJoystick.LOG_LINE));
        process.stdout.write(clc.bgWhite.black(letter));
        process.stdout.write(clc.move.to(0, 0));
    }

    logRelease(a) {
        let col = this.keysLog[a][0]*2;
        let letter = this.keysLog[a][1];
        process.stdout.write(clc.move.to(col,DeviceArcadeJoystick.LOG_LINE));
        process.stdout.write(letter);
        process.stdout.write(clc.move.to(0, 0));
    }

}

