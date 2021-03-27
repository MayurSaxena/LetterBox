# https://github.com/rdagger/micropython-ili9341
# https://learn.adafruit.com/adafruit-2-4-color-tft-touchscreen-breakout/spi-wiring-test
# https://vander.host/knowledgebase/security/how-to-generate-rsa-public-and-private-key-pair-in-pkcs8-format/


from ili9341 import Display
from machine import Pin, SPI, ADC, PWM
from xglcd_font import XglcdFont   
import uasyncio.get_event_loop
from letterbox import LetterBox

def initialize_display():
    # ILI9341 display
    spi = SPI(1, baudrate=32000000, sck=Pin(18), mosi=Pin(23), miso=Pin(19))
    display = Display(spi, dc=Pin(26), cs=Pin(5), rst=Pin(25), rotation=270, width=320, height=240)
    display.clear()
    return display

DISPLAY = initialize_display() # To display images
PHOTORESISTOR = ADC(Pin(32)) # To sense if lid is open of closed
SERVO = PWM(Pin(4), freq=50, duty=70) # To notify the user
unispace_font = XglcdFont('Unispace12x24.c', 12, 24) # this file needs to exist in the root

lbox = LetterBox(DISPLAY, SERVO, PHOTORESISTOR, unispace_font)
try:
    if lbox.initialize():
        lbox.bootup()
        loop = uasyncio.get_event_loop()
        loop.create_task(lbox.poll_async())
        loop.run_forever()
except Exception as e:
    print("Encountered an error {0}".format(str(e)))
finally:
    print("Didn't start LetterBox.")
    DISPLAY.clear()
    DISPLAY.draw_text(0, 54, 'Something went wrong!', unispace_font, 65535)
    DISPLAY.draw_text(0, 90, "LetterBox cannot continue.", unispace_font, 65535)
    DISPLAY.draw_text(0, 126, "Please contact us for help.", unispace_font, 65535)
    DISPLAY.draw_text(0, 162, "github.com/MayurSaxena", unispace_font, 65535)