import time
from rpi_ws281x import PixelStrip, Color

# GPIO4
# GPIO17
# GPIO27
# GPIO22
# GPIO10 (SPI_MOSI if you're not using SPI)
# GPIO9 (SPI_MISO if you're not using SPI)
# GPIO11 (SPI_CLK if you're not using SPI)
# GPIO5
# GPIO6
# GPIO13
# GPIO19 (SPI_MISO if you're not using both SPI channels)
# GPIO26

# LED strip configuration:
LED_COUNT = 8        # Number of LEDs
LED_PIN = 18         # GPIO pin (must support PWM)
LED_FREQ_HZ = 800000 # Frequency of the LEDs (usually 800kHz)
LED_DMA = 10         # DMA channel to use, can be 0-14
LED_BRIGHTNESS = 255 # Set brightness value (0 <= value <= 255)
LED_INVERT = False   # True to invert signal, when using a NPN transistor level shift

print("[DEBUG] Initializing LED strip...")  # Debug comment
strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS)
strip.begin()
print("[DEBUG] LED strip initialization completed.")  # Debug comment

def set_all(strip, color):
    print(f"[DEBUG] Setting all LEDs to color: {color}")  # Debug comment
    for i in range(strip.numPixels()):
        strip.setPixelColor(i, color)
    strip.show()

try:
    colors = [Color(255, 0, 0), Color(0, 255, 0), Color(0, 0, 255)]  # Add more colors if needed

    while True:
        for color in colors:
            set_all(strip, color)
            print("[DEBUG] Sleeping for 1 second before changing color...")  # Debug comment
            time.sleep(1)

except KeyboardInterrupt:
    print("[DEBUG] Detected KeyboardInterrupt. Turning off all LEDs...")  # Debug comment
    set_all(strip, Color(0, 0, 0))
