import sys
import time
import board
import busio
import socketio
from rpi_ws281x import PixelStrip, Color
import adafruit_mpr121

# LED strip configuration:
LED_COUNT = 128          # Number of LED lights on the strip
LED_PIN = 18             # GPIO pin connected to the LED strip pixels (must support PWM)
LED_FREQ_HZ = 800000     # Frequency of the LED signal (should be 800kHz)
LED_DMA = 10             # DMA channel to use for generating signal (try 10)
LED_BRIGHTNESS = 255     # Set to 0 for darkest and 255 for brightest
LED_INVERT = False       # True to invert the signal (when using NPN transistor level shift)
LEDS_PER_RING = 8        # Modify this to match the actual number of LEDs per ring
FADE_STEPS = 10          # Number of steps for fading

sio = socketio.Client()

# Define colors:
PURPLE = Color(128, 0, 128)
WHITE = Color(255,255,255)

strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS)
strip.begin()

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

def connect():
    print("Connected to Socket.IO server")

def disconnect():
    print("Disconnected from Socket.IO server")

sio.connect('http://localhost:3000')  # Replace with your server's URL

def turnOnLed(strip, ring_number, color):
    start_index = ring_mapping[ring_number] * LEDS_PER_RING
    for i in range(start_index, start_index + LEDS_PER_RING):
        strip.setPixelColor(i, color)
    strip.show()

def turnOffLed(strip, ring_number):
    start_index = ring_mapping[ring_number] * LEDS_PER_RING
    for i in range(start_index, start_index + LEDS_PER_RING):
        strip.setPixelColor(i, Color(0, 0, 0))
    strip.show()

def turn_off_all_leds(strip):
    for i in range(strip.numPixels()):
        strip.setPixelColor(i, Color(0, 0, 0))
    strip.show()

def choose_participant(strip, number_of_final_led):
    # Ensure the provided LED number is within the valid range
    if number_of_final_led < 0 or number_of_final_led >= len(ring_mapping):
        raise ValueError("Invalid LED number. Must be within the range of available rings.")

    # Calculate the end time based on the current time and duration
    end_time = time.time() + 5
    current_ring = 0  # Start with the first ring

    # Keep running until we reach the final LED after the duration has passed
    while True:
        # If the time duration has passed and we're at the final LED, break the loop
        if time.time() > end_time and current_ring == number_of_final_led:
            break

        # Turn on the current ring
        turnOnLed(strip, current_ring, PURPLE)
        time.sleep(0.1)  # Time the ring stays on
        
        # Turn off the current ring before moving to the next
        turnOnLed(strip, current_ring, Color(0, 0, 0))
        time.sleep(0.1)  # Time the ring stays off

        # Move to the next ring, wrap around if necessary
        current_ring = (current_ring + 1) % len(ring_mapping)

    # When the loop breaks, leave the final ring on
    turnOnLed(strip, number_of_final_led, PURPLE)


# if __name__ == "__main__":
#     command = sys.argv[1]

#     if command == 'turnOnLed':
#         ring_number = int(sys.argv[2])
#         color_name = sys.argv[3]
#         # Add a mechanism to convert color_name to an actual Color
#         color = Color(128, 0, 128)  # Example: Purple, you can extend this
#         turnOnLed(strip, ring_number, color)

#     elif command == 'turnOffLed':
#         ring_number = int(sys.argv[2])
#         # Add a mechanism to convert color_name to an actual Color
#         turnOffLed(strip, ring_number)

#     elif command == 'turn_off_all_leds':
#         turn_off_all_leds(strip)

#     elif command == 'choose_participant':
#         participant_number = int(sys.argv[2])
#         choose_participant(strip, participant_number)

# Initialize MPR121 for the touch sensor
i2c = busio.I2C(board.SCL, board.SDA)
mpr121 = adafruit_mpr121.MPR121(i2c)
last_state = [False] * 4

try:
    while True:
        # Check touch sensor state
        for i in range(4):
            current_state = mpr121[i].value
            if current_state and not last_state[i]:
                # print(f"Touched: {i}")
                sio.emit('touch_event', {'sensor_id': i, 'state': 'touched'})  # Emit touch event to server
                if i == 0:
                    turnOnLed(strip, 0, WHITE)
                    turnOnLed(strip, 1, WHITE)
                    turnOnLed(strip, 2, WHITE)
                elif i == 1:
                    turnOnLed(strip, 4, WHITE)
                    turnOnLed(strip, 5, WHITE)
                    turnOnLed(strip, 6, WHITE)
                elif i == 2:
                    turnOnLed(strip, 12, WHITE)
                    turnOnLed(strip, 13, WHITE)
                    turnOnLed(strip, 14, WHITE)
                elif i == 3:
                    turnOnLed(strip, 8, WHITE)
                    turnOnLed(strip, 9, WHITE)
                    turnOnLed(strip, 10, WHITE)

            elif not current_state and last_state[i]:
                # print(f"Untouched: {i}")
                sio.emit('touch_event', {'sensor_id': i, 'state': 'untouched'})  # Emit untouched event to server
                if i == 0:
                    turnOffLed(strip, 0)
                    turnOffLed(strip, 1)
                    turnOffLed(strip, 2)
                elif i == 1:
                    turnOffLed(strip, 4)
                    turnOffLed(strip, 5)
                    turnOffLed(strip, 6)
                elif i == 2:
                    turnOffLed(strip, 12)
                    turnOffLed(strip, 13)
                    turnOffLed(strip, 14)
                elif i == 3:
                    turnOffLed(strip, 8)
                    turnOffLed(strip, 9)
                    turnOffLed(strip, 10)

            last_state[i] = current_state

        time.sleep(0.25)

except KeyboardInterrupt:
    print("Keyboard Interrupt, exited")  # Debug comment
    sio.disconnect()  # Disconnect from Socket.IO server
    turn_off_all_leds(strip)
