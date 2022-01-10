const midiPlayer = require('midi-player-js');

module.exports = class MidiPlayer {

    player = null;
    volca = null;
    file = __dirname+'/../midifiles/vivaldi.mid';

    constructor(volca) {
        this.volca = volca;
        this.player = new midiPlayer.Player((e)=>{
            if (e.name == "Note on") {
                this.onNote(e.channel-1, e.noteNumber);
            }
            else if (e.name == "Controller Change" && e.number==4 )  {
                if (e.value > 100) {
                    this.onMute(e.channel-1);
                }
                else if  (e.value < 10) {
                    this.onUnmute(e.channel-1);
                }
            }
        });

        this.player.loadFile(this.file);
        setTimeout(()=>{
            console.log('Playing '+this.file)
            this.player.play();
        },2000);
    }

    onNote(channel, note) {
        if (channel < 6) {
            if (channel != 2) {
                this.volca.pitch(channel, note + 1);
            }
            this.volca.noteOn(channel, note);
        }
    }

    onMute(channel) {
        if (channel < 6) {
            this.volca.mute(channel);
        }
    }

    onUnmute(channel) {
        if (channel < 6) {
            this.volca.unmute(channel);
        }
    }

}