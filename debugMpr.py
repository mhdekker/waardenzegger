import time
import keyboard

# Mapping keys to "sensor" indices
key_map = {
    '1': 0,
    '2': 1,
    '3': 2,
    '4': 3,
}

print("Debugging script started.")
print("Press 1, 2, 3, or 4 to simulate a touch. Press 'q' to quit.")

while True:
    for key, sensor_index in key_map.items():
        try:
            if keyboard.is_pressed(key):
                print(f"Key '{key}' pressed - simulating touch on sensor {sensor_index}.")
                time.sleep(0.25)  # Prevent bouncing by waiting a bit
        except Exception as e:
            print(f"Error when checking key '{key}':", e)
    
    if keyboard.is_pressed('q'):
        print("Quitting debugging script.")
        break

    time.sleep(0.01)  # Small delay to prevent high CPU usage
