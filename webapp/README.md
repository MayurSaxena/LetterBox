# The Webapp

OK, so the webapp is pretty simple once you get to know it. Let's break it up piece by piece.

## Serverless Functions

The meat of the webapp code is in the serverless functions. These can be found [here](functions/). Thanks to Netlify Functions, each function is accessible at https://letterbox.mayursaxena.com/.netlify/functions/<NAME_OF_FUNCTION>. One other thing you need to know before diving in to them is that I'm also using a Netlify addon for FaunaDB. Once again, I'm on the free tier (which is pretty generous in terms of reads / writes). I use FaunaDB to track which users are allowed to access which devices. Below is a breakdown of the functions:

- devices
  - Requires authentication
  - Returns which devices a given user is allowed to send to.
  - Used to populate the device dropdown.
- encrypt
  - Needs a serial number and a payload.
  - Looks up the public key for that serial number in the [letterbox-storage](https://github.com/MayurSaxena/letterbox-storage) repo.
  - Generates a random AES key and IV
  - Encrypts the payload with said key and IV (AES-256-CBC).
  - Encrypts the key and IV with the public key of the device (RSAES-PKCS1-V1_5).
  - Send back the key, IV and encrypted payload.
  - Theoretically, only the holder of the private key can get back the key and IV to decrypt the image.
- onboard
  - Is used to register a new LetterBox
  - Needs a serial number and public key.
  - Attempts to encrypt an image with said public key.
  - Saves the public key in the repo and encrypted image for the device to later poll.
- received
  - Needs a serial number, message and signature (RSA-SHA256).
  - Receives a message and ensure that the signature related to that message was from the device with said serial number.
  - Essentially, make sure nobody other than the device deletes its image.
- register
  - Requires authentication.
  - Needs a serial number and friendly name.
  - Registers the (serial number, friendly name, email) combination in to FaunaDB.
- upload
  - Requires authentication.
  - Ensures that user can send to the specified device.
  - Takes a PNG data URI, converts it to RGB565, compresses it with DEFLATE, encrypts it, then writes it out to the repo.
- waiting
  - Needs a serial number.
  - Simply returns the SHA (and optionally content) of the next file waiting to be picked up (if any).

## Simple Frontend

The frontend itself (found in [dist](dist/)) is very simple one HTML file, some JS and some CSS. The HTML file holds the canvas and some drawing controls along with a button to make an account (via Netlify Identity) and to register your device. The JS code is what allows you to draw on the canvas, what resizes the canvas, control various drawing elements, and calls the appropriate Netlify functions.

## Running This Thing

It needs a few environment variables.

- GITHUB_TOKEN="token YOUR_PERSONAL_ACCESS_TOKEN"
  - This is to be able to access the storage repo.
- REPO_OWNER="REPO_OWNER_NAME"
  - In my case it's **MayurSaxena**
- REPO_NAME="STORAGE_REPO_NAME"
  - In my case it's **letterbox-storage**
- APP_COMMS_KEY="HEXDUMP_OF_32_RANDOM_BYTES"
  - That is, 64 characters from 0-9 or a-f
- FAUNADB_ADMIN_SECRET, FAUNADB_SERVER_SECRET, FAUNADB_CLIENT_SECRET
  - If you're using the FaunaDB Netlify addon, these are taken care of for you already.

You can put these all inside a **.env** file in the webapp folder. I recommend using the Netlify CLI to run this locally, as it makes testing serverless functions seamless. To do that, simply do the following in this directory:

```bash
npm install # to install the dependencies for the serverless functions
npm install netlify-cli -g
netlify dev
```

That's it! It'll automatically inject your variables from **.env** and read the **netlify.toml** file and spin up a server for you. You can also hook it up to your Netlify site for other cool features. More info can be found [here](https://www.netlify.com/products/dev/).