const EventEmitter = require('events');

class CapSenseHandler extends EventEmitter {
  constructor() {
    super();
  }

  activateSensor(sensorId) {
    console.log(`2 - Sensor ${sensorId} activated`);
    this.emit('sensorActivated', sensorId);
  }
}

module.exports = CapSenseHandler;