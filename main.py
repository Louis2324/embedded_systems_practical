import serial
import time
import paho.mqtt.client as mqtt

SERIAL_PORT = 'COM14'
BAUD_RATE = 9600
MQTT_BROKER = "broker.benax.rw"
MQTT_PORT = 1883
MQTT_TOPIC = "sensor_zigirumugabe_louis_miguel"

mqtt_client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)

try:
    print(f"Connecting to MQTT Broker at {MQTT_BROKER}...")
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start()
    print("MQTT Connected successfully.")
except Exception as e:
    print(f"Failed to connect to MQTT Broker: {e}")
    exit(1)

try:
    print(f"Opening Serial Port {SERIAL_PORT}...")
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)
    print("Serial port opened. Monitoring data...\n")
except Exception as e:
    print(f"Failed to open Serial Port: {e}")
    mqtt_client.loop_stop()
    exit(1)

try:
    while True:
        if ser.in_waiting > 0:
            raw_data = ser.readline().decode('utf-8').strip()
            
            if "Temperature:" in raw_data:
                try:
                    temp_value = raw_data.split(":")[1].strip().split(" ")[0]
                    current_time = time.strftime("%Y-%m-%d %H:%M:%S")
                    print(f"[{current_time}] Real-Time Value: {temp_value}°C")
                    
                    publish_result = mqtt_client.publish(MQTT_TOPIC, payload=temp_value, qos=1)
                    if publish_result.rc != mqtt.MQTT_ERR_SUCCESS:
                        print(" -> Failed to publish data.")
                except IndexError:
                    pass
                    
        time.sleep(0.01)

except KeyboardInterrupt:
    print("\nTerminating program monitoring...")
finally:
    ser.close()
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
    print("Resources clean up complete.")