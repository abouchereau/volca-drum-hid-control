const midiPlayer = require('midi-player-js');

module.exports = class MidiPlayer {

    player = null;
    volca = null;

    constructor(volca) {
        this.volca = volca;
        this.player = new midiPlayer.Player((e)=>{
            if (e.name == "Note on") {
                this.onNote(e.channel-1, e.noteNumber);
            }
        });

        this.player.loadFile(__dirname+'/../midifiles/ch14.mid');
        this.player.play();
    }

    onNote(channel, note) {
        if (channel < 6) {
            this.volca.pitch(channel, note + 1);
            this.volca.noteOn(channel);
        }
    }

}