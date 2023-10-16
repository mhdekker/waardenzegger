const { spawn } = require('child_process');
const EventEmitter = require('events');

class CapSenseHandler extends EventEmitter {
  constructor() {
    super();
    this.initPythonProcess();
  }

  initPythonProcess() {
    const pythonProcess = spawn('python3', ['./readMpr.py']);

    pythonProcess.stdout.on('data', (data) => {
      const touchedInput = data.toString('utf8').trim();
      this.activateSensor(touchedInput);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data.toString('utf8').trim()}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);
    });

    pythonProcess.on('exit', (code) => {
      console.log(`Python script explicitly exited with code ${code}`);
    });
  }

  activateSensor(sensorId) {
    this.emit('sensorActivated', sensorId);
  }
}

module.exports = CapSenseHandler;
