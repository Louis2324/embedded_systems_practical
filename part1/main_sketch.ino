#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <math.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

const int digitalPin = 10;
const int analogPin = A0;

String candidateName = "ZIGIRUMUGABE Louis Miguel";
String displayBuffer = "";

unsigned long previousMillis = 0;
const long tempInterval = 1000;

unsigned long scrollMillis = 0;
const long scrollInterval = 350;
int scrollPos = 0;

void setup()
{
    pinMode(digitalPin, INPUT);
    Serial.begin(9600);

    lcd.init();
    lcd.backlight();

    displayBuffer = candidateName + "   ";
}

void loop()
{
    unsigned long currentMillis = millis();

    if (currentMillis - scrollMillis >= scrollInterval)
    {
        scrollMillis = currentMillis;

        lcd.setCursor(0, 0);
        String toPrint = displayBuffer.substring(scrollPos, scrollPos + 16);
        if (toPrint.length() < 16)
        {
            toPrint += displayBuffer.substring(0, 16 - toPrint.length());
        }

        lcd.print(toPrint);

        scrollPos++;
        if (scrollPos >= displayBuffer.length())
        {
            scrollPos = 0;
        }
    }

    if (currentMillis - previousMillis >= tempInterval)
    {
        previousMillis = currentMillis;

        int digitalValue = digitalRead(digitalPin);
        int analogValue = analogRead(analogPin);

        if (analogValue < 1)
            analogValue = 1;
        if (analogValue > 1022)
            analogValue = 1022;

        float resistance = 10000.0 * (1023.0 / (float)analogValue - 1.0);
        float logR = log(resistance);
        float temperatureKelvin = 1.0 / (0.001129148 + (0.000234125 * logR) + (0.0000000876741 * logR * logR * logR));
        float temperatureCelsius = temperatureKelvin - 273.15;

        Serial.print("Temperature: ");
        Serial.print(temperatureCelsius, 1);
        Serial.println(" C");

        if (digitalValue == LOW)
        {
            Serial.println("Temperature threshold exceeded!");
        }

        lcd.setCursor(0, 1);
        lcd.print("Temp: ");
        lcd.print(temperatureCelsius, 1);
        lcd.print((char)223);
        lcd.print("C        ");
    }
}