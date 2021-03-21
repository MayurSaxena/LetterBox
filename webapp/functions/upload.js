const { request } = require('@octokit/request')
const requestWithAuth = request.defaults({
    headers: {
        authorization: process.env.GITHUB_TOKEN,
    },
})
const sharp = require('sharp')
const fetch = require('node-fetch')
const { URL } = process.env

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Method Not Allowed',
        }
    }

    let userInfo = context.clientContext && context.clientContext.user
    if (!userInfo) {
        return {
            statusCode: 403,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'You must be logged in.',
        }
    }

    let req_body
    try {
        req_body = JSON.parse(event.body)
    } catch {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Bad Request',
        }
    }

    let device_id = req_body.id
    let canvas_data = req_body.data
    if (device_id == null || canvas_data == null) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Bad Request',
        }
    }

    let auth = await fetch(`${URL}/.netlify/functions/devices`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${context.clientContext.identity.token}`,
        },
    })
        .then((res) => {
            if (res.ok) {
                return res.json()
            }
            throw new Error(res.statusText)
        })
        .then(
            (json_res) => json_res
            //json_res.filter((dev) => dev.id == device_id).length > 0
        )
        .catch((error) => error)

    return {
        statusCode: 403,
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify(auth),
    }

    let rgb565_buff = null
    try {
        rgb565_buff = await sharp(
            new Buffer.from(canvas_data.split(';')[1].split(',')[1], 'base64')
        )
            .resize(320, 240)
            .raw()
            .toBuffer()
            .then((img_buff) =>
                RGB8888_To_RGB565(new Uint8ClampedArray(img_buff.buffer))
            )
    } catch {
        return { statusCode: 400, body: 'Malformed Image' }
    }

    let enc = await fetch(`${URL}/.netlify/functions/encrypt`, {
        method: 'POST',
        body: JSON.stringify({
            id: device_id,
            data: rgb565_buff.toString('base64'),
        }),
        headers: { 'Content-Type': 'application/json' },
    })
        .then((res) => {
            if (res.ok) {
                return res.json()
            }
            throw new Error(res.statusText)
        })
        .catch((error) => null)

    if (enc == null) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Encryption failed.',
        }
    }

    let existing_sha = await fetch(`${URL}/.netlify/functions/waiting`, {
        method: 'POST',
        body: JSON.stringify({
            id: device_id,
        }),
        headers: { 'Content-Type': 'application/json' },
    })
        .then((res) => {
            if (res.ok) {
                return res.text()
            }
            throw new Error(res.statusText)
        })
        .then((txt) => (txt == '' ? undefined : txt))
        .catch((error) => null)

    if (existing_sha === null) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Error getting SHA.',
        }
    }

    return requestWithAuth('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner: process.env.REPO_OWNER,
        repo: process.env.REPO_NAME,
        path: `${device_id}/out.json`,
        message: `Adding file for ${device_id}`,
        content: Buffer.from(JSON.stringify(enc)).toString('base64'),
        sha: existing_sha,
    })
        .then((response) => response.data)
        .then((data) => ({
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Successfully uploaded image.',
        }))
        .catch((error) => ({
            statusCode: 500,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Failed to upload image.',
        }))
}

function RGB8888_To_RGB565(pixel_buff) {
    // where pixel_buff is of format [R,G,B,A,...] -> where R,G,B,A are each 8 bit integers
    // newBuff is of format [px1,px2,...,pxN] -> where pxY is a 16 bit integer containing RGB data
    // for every 4 bytes in the original array, we only need two bytes now
    let newBuff = Buffer.alloc(pixel_buff.length / 2)

    let bgColor_24bit = 0x000000 // default background color is black
    let offset = 0 // offset tracker when writing to buffer
    for (var i = 0; i < pixel_buff.length; i += 4) {
        // process sets of 4
        let alpha = pixel_buff[i + 3] / 255 //8 bits (but as a ratio from 0 to 1)

        // >> 16 saves the 8 bits of RED data
        let red = (1 - alpha) * (bgColor_24bit >> 16) + alpha * pixel_buff[i] //8 bits

        // >> 8 discards BLUE data, & 0xff keeps only the last 8 bits (GREEN data)
        let green =
            (1 - alpha) * ((bgColor_24bit >> 8) & 0xff) +
            alpha * pixel_buff[i + 1] //8 bits

        // & 0xff keeps only the last 8 bits (BLUE data)
        let blue =
            (1 - alpha) * (bgColor_24bit & 0xff) + alpha * pixel_buff[i + 2] //8 bits

        let new_pixel = 0
        // 0000000000000000
        // & 0xf8 zeroes the last 3 bits of 8 bit long RED, then we push it to the beginning of 16 bit new_pixel
        //RRRRRZZZ00000000
        // & 0xfc zeroes the last 2 bits of 8 bit long GREEN, then we pad 3 0 on to the end and add to 16 bit new pixel
        //RRRRRGGGGGGZZ000
        // >> 3 discards the last 3 bits of 8 bit BLUE, and then we add it on to the end of new_pixel
        //RRRRRGGGGGGBBBBB
        new_pixel = ((red & 0xf8) << 8) + ((green & 0xfc) << 3) + (blue >> 3)
        offset = newBuff.writeUInt16BE(new_pixel, offset)
    }
    return newBuff
}
