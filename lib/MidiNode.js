
const midi = require('midi');
const NanoTimer = require('nanotimer');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

module.exports = class MidiNode {
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
