# The Microcontroller

## Hardware

### Parts

- [TinyPICO (ESP32)](https://www.mouser.ca/ProductDetail/Unexpected-Maker/CS-TINYPICO-01?qs=PzGy0jfpSMtRQ8hC9E8%252B4w%3D%3D)
- [2.4" ILI9341 display (320x240)](https://www.adafruit.com/product/2478)
  - In SPI mode, don't forget [this](https://learn.adafruit.com/adafruit-2-4-color-tft-touchscreen-breakout/spi-wiring-test)
- [Servo](https://www.mouser.ca/ProductDetail/DFRobot/SER0006/?qs=kE1vTINknaVeJIz3lDBUDw%3D%3D)
- [Photoresistor](https://www.sparkfun.com/products/9088)

### Wiring Diagram

### Other Useful Things



## Software

I used MicroPython to program the ESP32 (as opposed to using C or whatever it is in the Arduino IDE). I actually had to build my own version of MicroPython firmware for the ESP32 to include some RSA functionality. And you already know that I just had to use more Python modules than MicroPython comes with (details below). Since I was already building my own firmware, I can also include Python modules to be frozen on to the image. Presumably this is better for speed and all that - and it's less files to copy over with **ampy**. Some stuff though (like **main.py** and **boot.py**) you can't freeze on to the firmware, so this still need to be copied over with **ampy**.

### Custom Modules

As mentioned above, I had to write plenty of code for this thing (and of course find a lot of it on the Internet already).

#### C Modules

These need to be compiled in using **make**.

- modursa
  - Gives RSA encrypt, decrypt and sign functionality to MicroPython.
  - Piecemeal incorporated from [here](https://github.com/pycom/pycom-micropython-sigfox/blob/Dev/extmod/moducryptolib.c)

#### Python Modules

These can be included on the device, or frozen in with firmware.

- ili9341
  - To interface with the display
  - Originally from [here](https://github.com/rdagger/micropython-ili9341), but I forked it [here](https://github.com/MayurSaxena/micropython-ili9341). I did this to add functionality to draw to the display straight from a stream of bytes (as opposed to writing to disk first).
- urequests
  - To make it easier to do API calls
  - From [here](https://github.com/micropython/micropython-lib/blob/master/urequests/urequests.py)
- xglcd_font
  - This one is to load fonts to draw text to the screen.
  - From the [same repository](https://github.com/rdahttps://github.com/micropython/micropython-lib/blob/master/urequests/urequests.pygger/micropython-ili9341) as the ili9341 module.
- wifimgr
  - Original code from [here](https://github.com/tayfunulu/WiFiManager/)
  - I wrapped it all in a class and split apart some code just to make it "cleaner"
  - I also added a `ConnectedRequester` class - which is a class that waits for connection before doing a web request
    - Hence, **wifimgr** now depends on **urequests**. I could probably split `ConnectedRequester` out in to its own module.
- letterbox
  - This one's all me baby!
  - The heart of what gives all this hardware LetterBox functionality.

### Core Files
These are files that must be copied over using something like **ampy** or **rshell**.

- boot.py
  - Simply enables garbage collection at boot - I don't even know if this is necessary.
  - Must be named boot.py
- Unispace12x24.c
  - The font used to render text to the screen.
- main.py
  - Automatically runs after boot.py
  - Initializes LetterBox and starts up the poll routine.

## Using This For Yourself

Fortunately, I've compiled all the firmware for you, so all you need to do is flash that firmware and then transfer everything under [core_files](core_files/) over to the ESP32. But there is something you need to do first:

### Generate Keys

Use the script in **[utils/generate_keys.sh](utils/generate_keys.sh)** to generate a `public.crt` and `private.key` file. These both need to be put on the LetterBox as well.

```
cd core_files
../utils/generate_keys.sh
```

Now, we can transfer everything over to the ESP32.

I did this part on a Windows system.

```
esptool.py.exe --chip esp32 --port COM3 erase_flash
esptool.py.exe --chip esp32 --port COM3 write_flash -z 0x1000 .\path\to\firmware.bin
ampy -p COM3 put .\core_files\public.crt
ampy -p COM3 put .\core_files\private.key
ampy -p COM3 put .\core_files\Unispace12x24.c
ampy -p COM3 put .\core_files\boot.py
ampy -p COM3 put .\core_files\main.py
```






