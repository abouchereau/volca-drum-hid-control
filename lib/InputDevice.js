const HID = require('node-hid');
const clc = require('cli-color');

module.exports = class InputDevice {//abstract

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
    index = null;
    static INDEX_COUNT = 0;
    static LOG_LINE = 12;
    hasParentProcess = false;

    constructor(volca, logToScreen) {
        this.hasParentProcess = typeof process.send != "undefined";
        this.logToScreen = logToScreen;
        this.volca = volca;
        this.index = InputDevice.INDEX_COUNT++;
    }

    init() {
        try {
            this.device = new HID.HID(this.VENDOR_ID,this.PRODUCT_ID);
            if (this.logToScreen) {
                process.stdout.write(clc.move.to(0, InputDevice.LOG_LINE + this.index));
                process.stdout.write(clc.erase.line);
                process.stdout.write((clc.green(":) " + this.name + " connected")));
                if (typeof process.send != "undefined") {
                    process.send({"event":"INPUT_STATUS","value": 1,"index":this.index});
                }
            }
            this.device.on('data',this.onDataChange.bind(this));
            this.device.on('error',this.onError.bind(this));
        } catch (err) {
            if (this.logToScreen) {
                process.stdout.write(clc.move.to(0, InputDevice.LOG_LINE + this.index));
                process.stdout.write(clc.erase.line);
                process.stdout.write(clc.red(":( " + this.name + " not connected"));
                if (this.hasParentProcess) {
                    process.send({"event":"INPUT_STATUS","value": -1,"index":this.index});
                }
            }
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
        if (this.logToScreen) {
            process.stdout.write(clc.move.to(0, InputDevice.LOG_LINE + this.index));
            process.stdout.write(clc.erase.line);
            process.stdout.write(clc.red(":( " + this.name + " not connected"));
        }
        if (this.hasParentProcess) {
            process.send({"event":"INPUT_STATUS","value": -1,"index":this.index});
        }
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

    onPress() {
        if (this.hasParentProcess) {
            process.send({"event": "INPUT_STATUS", "value": -1, "index": this.index});
        }
    }

    onRelease() {}
}