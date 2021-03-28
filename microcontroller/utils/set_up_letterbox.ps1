param ([Parameter(Mandatory)]$Port, [Parameter(Mandatory)]$FirmwareLocation, [Parameter(Mandatory)]$CoreFilesDir)

echo "Erasing flash..."
esptool.py.exe --chip esp32 --port $Port erase_flash

echo "Flashing firmware..."
esptool.py.exe --chip esp32 --port $Port write_flash -z 0x1000 $FirmwareLocation

echo "Transferring core files..."
ampy.exe -p $Port put $CoreFilesDir\public.crt
ampy.exe -p $Port put $CoreFilesDir\private.key
ampy.exe -p $Port put $CoreFilesDir\Unispace12x24.c
ampy.exe -p $Port put $CoreFilesDir\boot.py
ampy.exe -p $Port put $CoreFilesDir\main.py

echo "Done!"