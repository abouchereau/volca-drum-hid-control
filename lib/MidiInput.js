const midiIn = require('midi');

module.exports = class MidiInput {


    input = null;
    volca = null;
    hasParentProcess = false;
    CMD_NOTE_OFF = 8;
    CMD_NOTE_ON = 9;
    CMD_CONTROL_CHANGE = 11;
    CMD_PROGRAM_CHANGE = 12;
    CMD_PITCH_BEND = 14;
    index = null;
    name = "";
    static INDEX_COUNT = 0;

    constructor(volca) {
        this.hasParentProcess = typeof process.send != "undefined";
        this.volca = volca;
    }

    openNextDevice() {
        this.input = new midiIn.Input();
        let nbMidiDevices = this.input.getPortCount();
        if (MidiInput.INDEX_COUNT < nbMidiDevices) {
            this.index = MidiInput.INDEX_COUNT;
            this.name = this.input.getPortName(this.index);
            console.log(this.index,this.name);
            if (this.name.indexOf("RtMidi")<0) {//éviter de boucler
                this.input.on('message', (deltaTime, message) => {
                    if (this.index == 1) {
                        console.log(this.index, message);

                        this.onMidiMessage(message);
                    }
                });
                console.log("Opening midi device " + this.index + " : " + this.name);
                this.input.openPort(this.index);
            }
            MidiInput.INDEX_COUNT++;
            return true;
        }
        return false;
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
        //console.log("noteOn",this.index, note);
        let part = this.index % 6;
        this.volca.pitch(part,note+1);
        this.volca.noteOn(part);
        if (this.hasParentProcess) {
            process.send({"event":"INPUT_STATUS","value": 2,"index":3});
        }
    }

}