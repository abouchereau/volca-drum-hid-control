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