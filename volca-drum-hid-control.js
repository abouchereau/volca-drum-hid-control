// à lancer en root sous linux
//connecter d'abord le matériel

const readline = require('readline');
const MidiNode = require("./lib/MidiNode");
const VolcaDrum = require("./lib/VolcaDrum");
const DeviceDJHeroPS = require("./lib/DeviceDJHeroPS");
const DeviceArcadeJoystick = require("./lib/DeviceArcadeJoystick");
const yargs = require('yargs');

const argv = yargs
    .option("midiOutputIndex", {
        alias: "o",
        describe: "The index of the Midi Output",
        type: 'number',
    })
    .option("logToFile", {
        alias: "lf",
        describe: "Log to file",
        type:'boolean'})
    . option("logToScreen", {
        alias: "ls",
        describe: "Log to Screen",
        type:'boolean'
    }).argv;


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//console.log(argv.midiOutputIndex, argv.logToFile, argv.logToScreen);


let midiNode = new MidiNode();
midiNode.scanOutput();
let volca = new VolcaDrum(midiNode, argv.logToFile, argv.logToScreen);

if(typeof argv.midiOutputIndex == "number") {
    start(argv.midiOutputIndex);
}
else {
    rl.question("=> Choose MIDI Output (default: " + midiNode.DEFAULT_MIDI_INDEX + ") : ", paramMidiIndex => {
        let midiOutIndex = midiNode.DEFAULT_MIDI_INDEX;
        if (paramMidiIndex == null || paramMidiIndex == "" || parseInt(paramMidiIndex) > (midiNode.nbMidiDevices - 1)) {
            rl.question("=> Bad index for MIDI Output", a => process.exit());
        }
        midiOutIndex = parseInt(paramMidiIndex);
        start(midiOutIndex);
    });
}

function start(midiOutIndex) {
    midiNode.midiOutIndex = midiOutIndex;
    midiNode.openOutput();
    volca.logger.clear();
    volca.onSettingChange();
    let deviceDJHero = new DeviceDJHeroPS(volca, argv.logToScreen);
    let deviceArcadeJoystick = new DeviceArcadeJoystick(volca, argv.logToScreen);
    deviceDJHero.init();
    deviceArcadeJoystick.init();
}