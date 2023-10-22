const ws281x = resudo pip3 install rpi_ws281x adafruit-circuitpython-neopixel
quire('rpi-ws281x-native');

const NUM_LEDS = 8;
const GPIO_PIN = 4;

ws281x.init(NUM_LEDS);

let colorIndex = 0;
const colors = [
    0xff0000,  // Red
    0x00ff00,  // Green
    0x0000ff,  // Blue
    0xffff00,  // Yellow
    0xff00ff,  // Magenta
    0x00ffff,  // Cyan
    0xffffff,  // White
    0x000000   // Off
];

function updateColor() {
    const data = new Uint32Array(NUM_LEDS);

    for (let i = 0; i < NUM_LEDS; i++) {
        data[i] = colors[colorIndex];
    }

    ws281x.render(data);

    colorIndex = (colorIndex + 1) % colors.length;
}

setInterval(updateColor, 1000);

// Clean up on exit
process.on('SIGINT', () => {
    ws281x.reset();
    process.nextTick(() => process.exit(0));
});
