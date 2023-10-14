const EventEmitter = require('events');

class CapSenseHandler extends EventEmitter {
  constructor() {
    super();
  }

  activateSensor(sensorId) {
    console.log(`Sensor ${sensorId} activated`);
    this.emit('sensorActivated', sensorId);
  }
}

module.exports = CapSenseHandler;