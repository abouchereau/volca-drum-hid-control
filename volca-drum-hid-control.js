// à lancer en root sous linux
//connecter d'abord le matériel

const readline = require('readline');
const MidiNode = require("./lib/MidiNode");
const VolcaDrum = require("./lib/VolcaDrum");
const DeviceDJHeroPS = require("./lib/DeviceDJHeroPS");
const DeviceArcadeJoystick = require("./lib/DeviceArcadeJoystick");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
    volca.logger.clear();
    volca.onSettingChange();
    let deviceDJHero = new DeviceDJHeroPS(volca);
    let deviceArcadeJoystick = new DeviceArcadeJoystick(volca);
    deviceDJHero.init();
    deviceArcadeJoystick.init();
});

