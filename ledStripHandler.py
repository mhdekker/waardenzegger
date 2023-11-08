import time
from rpi_ws281x import PixelStrip, Color

# LED strip configuration:
LED_COUNT = 128          # Number of LED lights on the strip
LED_PIN = 18             # GPIO pin connected to the LED strip pixels (must support PWM)
LED_FREQ_HZ = 800000     # Frequency of the LED signal (should be 800kHz)
LED_DMA = 10             # DMA channel to use for generating signal (try 10)
LED_BRIGHTNESS = 255     # Set to 0 for darkest and 255 for brightest
LED_INVERT = False       # True to invert the signal (when using NPN transistor level shift)
LEDS_PER_RING = 8        # Modify this to match the actual number of LEDs per ring
FADE_STEPS = 10          # Number of steps for fading

# Define colors:
PURPLE = Color(128, 0, 128)

print("[DEBUG] Initializing LED strip...")  # Debug comment
strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS)
strip.begin()
print("[DEBUG] LED strip initialization completed.")  # Debug comment

# Map the logical ring numbers to the actual LED indices (you need to define the order here)
ring_mapping = {
    0: 0,
    1: 8,
    2: 14,
    3: 10,
    4: 6, 
    5: 13,
    6: 11,
    7: 12,
    8: 3, 
    9: 5, 
    10: 15,
    11: 9,
    12: 2,
    13: 1,
    14: 7,
    15: 4,
}

def set_ring(strip, ring_number, color):
    start_index = ring_mapping[ring_number] * LEDS_PER_RING
    for i in range(start_index, start_index + LEDS_PER_RING):
        strip.setPixelColor(i, color)
    strip.show()

def turn_off_all_leds(strip):
    for i in range(strip.numPixels()):
        strip.setPixelColor(i, Color(0, 0, 0))
    strip.show()

# Function to turn on rings in sequence based on the mapping and then turn off, continuously
def turn_on_and_off_rings_continuous(strip):
    while True:
        for ring_number in sorted(ring_mapping.keys()):
            set_ring(strip, ring_number, PURPLE)  # Turn on the ring with purple color
            time.sleep(0.1)  # Time the ring stays on
            set_ring(strip, ring_number, Color(0, 0, 0))  # Turn off the ring
            time.sleep(0.1)  # Time the ring stays off

def select_participant(strip, number_of_final_led, duration=5):
    # Ensure the provided LED number is within the valid range
    if number_of_final_led < 0 or number_of_final_led >= len(ring_mapping):
        raise ValueError("Invalid LED number. Must be within the range of available rings.")

    # Calculate the end time based on the current time and duration
    end_time = time.time() + duration
    current_ring = 0  # Start with the first ring

    # Keep running until we reach the final LED after the duration has passed
    while True:
        # If the time duration has passed and we're at the final LED, break the loop
        if time.time() > end_time and current_ring == number_of_final_led:
            break

        # Turn on the current ring
        set_ring(strip, current_ring, PURPLE)
        time.sleep(0.1)  # Time the ring stays on
        
        # Turn off the current ring before moving to the next
        set_ring(strip, current_ring, Color(0, 0, 0))
        time.sleep(0.1)  # Time the ring stays off

        # Move to the next ring, wrap around if necessary
        current_ring = (current_ring + 1) % len(ring_mapping)

    # When the loop breaks, leave the final ring on
    set_ring(strip, number_of_final_led, PURPLE)

try:
    # Here, replace 5 with the index of the ring you want to select
    turn_off_all_leds(strip)

except KeyboardInterrupt:
    print("[DEBUG] Detected KeyboardInterrupt. Turning off all LEDs...")  # Debug comment
    turn_off_all_leds(strip)
