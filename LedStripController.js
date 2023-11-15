const { spawn } = require('child_process');

class LedStripController {
    constructor(pythonScriptPath) {
        this.pythonScriptPath = pythonScriptPath;
    }

    setRing(ringNumber) {
        this.runPythonScript('set_ring', ringNumber, "PURPLE");
    }

    turnOffAllLeds() {
        this.runPythonScript('turn_off_all_leds');
    }

    chooseParticipant(participantNumber) {
        this.runPythonScript('choose_participant', participantNumber);
    }

    runPythonScript(...args) {
        // Use sudo to run the Python script with superuser privileges
        const process = spawn('sudo', ['python3', this.pythonScriptPath, ...args]);

        process.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        process.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        process.on('close', (code) => {
            console.log(`Python script exited with code ${code}`);
        });
    }
}

module.exports = LedStripController;
