# LetterBox

## An open source implementation of Lovebox

I was looking for a hobby and a gift - so I thought why not try my hand at making one of these guys by myself? And I had fun doing it.

Of course if you want to check out the original product, you can find it [here](https://en.lovebox.love)!

### Repo Structure

This project is split up in to 2 distinct parts: a web front end to send images, and a microcontroller which is the LetterBox itself.

#### The Frontend

The front end is very simple - it's one HTML file with a canvas on it and a few static JavaScript files for the interactivity logic (clicking buttons, drawing, changing colors, etc.).

The meat of the frontend is actually in the serverless functions! It's these functions that take the canvas image and upload them to the appropriate LetterBox. More details can be found in the webapp folder.

#### The Microcontroller

This part of the code is all about the LetterBox itself. I used an ESP32 microcontroller (TinyPico) and MicroPython to grab images and render them to the display. Again, more details can be found in the microcontroller folder.

### More Details

More details can be found in the README files inside each folder, but here's a nutshell of how everything works.

1. When you upload the firmware and code to the LetterBox, you also send with it a public/private keypair that you generate.
2. When LetterBox turns on for the first time, it contacts its server to register its serial number and public key.
3. A user visits https://letterbox.mayursaxena.com and registers their serial number and email.
4. When the user sends an image, the image is encrypted with the registered public key (sort of). This way, only the entitled device can see the image.
5. The LetterBox polls the server for any new images. When it finds one, it downloads and decrypts it.

One of the cooler parts here (in my opinion) is that I'm just using GitHub as a file system and saving on infrastructure costs. I also believe everything is pretty well secured enough to leave that as a public repo, which can be found [here](https://github.com/MayurSaxena/letterbox-storage). On top of that, I'm using the free tier of Netlify serverless functions and not needing infrastructure there either.

### Work To Be Done
Of course, this project can be made better. Here are a few ideas:

- Allow for queuing of multiple images. Right now, sending a new one will overwrite the old one even if it hasn't been seen.
- Allow multiple users to register to send to the same device. Right now, only one email can send to a given device.

### Can I Use This And Make My Own LetterBox?
Theoretically, you could just put the firmware on your own ESP32 and make your own account at https://letterbox.mayursaxena.com and everything would just work. But, I'm on the free tier of pretty much every technology that's being used - so everything would stop working really quickly. It's probably better if you just configure your own free accounts for everything and "host it yourself". I'll try and document as best as I can, but you can always reach out if you need help.

### The Final Result

Pictures coming soon!
