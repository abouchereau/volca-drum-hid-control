const midiIn = require('midi');

module.exports = class MidiInput {

    devices = [];
    input = null;
    nbMidiDevices = 0;
    volca = null;
    hasParentProcess = false;
    CMD_NOTE_OFF = 8;
    CMD_NOTE_ON = 9;
    CMD_CONTROL_CHANGE = 11;
    CMD_PROGRAM_CHANGE = 12;
    CMD_PITCH_BEND = 14;

    constructor(volca) {
        this.hasParentProcess = typeof process.send != "undefined";
        this.volca = volca;
        this.scanDevices();
    }

    scanDevices() {
        console.info("Scanning MIDI Inputs...");
        this.input = new midiIn.Input();
        this.nbMidiDevices = this.input.getPortCount();
        for(let i=0;i<this.nbMidiDevices;i++) {
            this.devices[i] = this.input.getPortName(i);
        }
        this.input.on('message', (deltaTime, message) => {
            this.onMidiMessage(message);
        });
    }

    openFromNamePart(name) {
        let ok = false;
        for(let i in this.devices) {
            console.log("i=",i, typeof i);
            if (this.devices[i].indexOf(name)>-1) {
                this.input.openPort(Number(i));
                this.input.ignoreTypes(false, false, false);
                console.log("Connecting Midi Input : "+this.devices[i]);
                if (this.hasParentProcess) {
                    process.send({"event":"INPUT_STATUS","value": 1,"index":3});
                }
                ok = true;
            }
        }
        if (!ok) {
            console.log("Midi Input Not Found : "+name);
        }
    }

    onMidiMessage(m) {
        let cmd = m[0] >> 4;
        let channel = m[0] & 0xf;
        let param1 = m[1];
        let param2 = m[2];
        switch(cmd) {
            case this.CMD_NOTE_ON:
                this.noteOn(channel, param1, param2)
                break;
        }
    }

    noteOn(channel, note, velocity) {
        this.volca.pitch(0,note);
        this.volca.noteOn(0);
        if (this.hasParentProcess) {
            process.send({"event":"INPUT_STATUS","value": 2,"index":3});
        }
    }

}