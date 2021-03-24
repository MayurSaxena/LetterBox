const { request } = require('@octokit/request')
const requestWithAuth = request.defaults({
    headers: {
        authorization: process.env.GITHUB_TOKEN,
    },
})
const crypto = require('crypto')

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
    let blob = req_body.data
    if (device_id == null || blob == null) {
        //need an id and something to encrypt
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Bad Request',
        }
    }

    try {
        blob = Buffer.from(blob, 'base64') //Does this check even do anything?
    } catch {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Base64 data required',
        }
    }

    let public_key = await requestWithAuth(
        //get the public key
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
            owner: process.env.REPO_OWNER,
            repo: process.env.REPO_NAME,
            path: `${device_id}/public.crt`,
        }
    )
        .then((response) => response.data)
        .then((data) => {
            return Buffer.from(data.content, 'base64').toString('ascii') //github base64's the content and gives it to us
        })
        .catch((error) => null)

    if (public_key == null) {
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'No Key Found',
        }
    }
    try {
        let aes_key = crypto.randomBytes(32) //generate random key and IV
        let aes_iv = crypto.randomBytes(16)
        let response = {
            d: AESEncrypt(blob, aes_key, aes_iv), //blob encryption via AES using the above key and IV
            k: RSAEncrypt(aes_key.toString('base64'), public_key), //save the key and IV also encrypted using RSA
            i: RSAEncrypt(aes_iv.toString('base64'), public_key),
        }
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(response),
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: `Encryption failed. ${error}`,
        }
    }
}

function RSAEncrypt(plaintext, public_key) {
    let ciphertext = crypto.publicEncrypt(
        {
            key: public_key,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(plaintext)
    )
    return ciphertext.toString('base64')
}

function AESEncrypt(plaintext, key, iv) {
    let aesCipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let enc = Buffer.concat([aesCipher.update(plaintext), aesCipher.final()])
    return enc.toString('base64')
}
