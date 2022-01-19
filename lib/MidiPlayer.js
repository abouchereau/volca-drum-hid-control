const midiPlayer = require('midi-player-js');

module.exports = class MidiPlayer {

    player = null;
    volca = null;
    file = __dirname+'/../midifiles/vivaldi.mid';
    channelNoSustain = [false, false, false, false, false, false];

    constructor(volca) {
        this.volca = volca;
        this.player = new midiPlayer.Player((e)=>{
            if (e.name == "Note on") {
                this.onNoteOn(e.channel-1, e.noteNumber);
            }
            else if (e.name == "Note off") {
                this.onNoteOff(e.channel-1);
            }
            else if (e.name == "Controller Change" && e.number==4 )  {
                if (e.value > 100) {
                    console.log("No sustain", e.channel-1);
                    this.channelNoSustain[e.channel-1] = true;
                }
                else if  (e.value < 10) {
                    console.log("Sustain", e.channel-1);
                    this.channelNoSustain[e.channel-1] = false;
                }
            }
        });

        this.player.loadFile(this.file);
        setTimeout(()=>{
            console.log('Playing '+this.file)
            this.player.play();
        },2000);
    }

    onNoteOn(channel, note) {
        if (channel < 6) {
            if (channel != 2) {
                this.volca.pitch(channel, note + 1);
            }
            if (this.channelNoSustain[channel] && this.volca.isMute(channel)) {
                this.volca.unmute(channel, note);
            }
            this.volca.noteOn(channel, note);
        }
    }

    onNoteOff(channel) {
        if (channel < 6) {
            if (this.channelNoSustain[channel]) {
                this.volca.mute(channel);
            }
        }
    }



}