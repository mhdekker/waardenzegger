import time
import board
import busio
import sys

import adafruit_mpr121

i2c = busio.I2C(board.SCL, board.SDA)

mpr121 = adafruit_mpr121.MPR121(i2c)

while True:
    for i in range(4):
        if mpr121[i].value:
            print(i)
            sys.stdout.flush()
    time.sleep(0.25)

# class MockMPR121:
#     def __getitem__(self, key):
#         # Simulates input on pin 1 and 2
#         return key in [0, 1, 2, 3]

# mpr121 = MockMPR121()

# while True:
#     for i in range(4):
#         if mpr121[i]:
#             print(i)
#             sys.stdout.flush()
#     time.sleep(0.25)  # mimic the original delay