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
    let msg = req_body.message
    let sig = req_body.signature
    if (device_id == null || msg == null || sig == null) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Bad Request',
        }
    }

    let public_key = await requestWithAuth(
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
            owner: process.env.REPO_OWNER,
            repo: process.env.REPO_NAME,
            path: `${device_id}/public.crt`,
        }
    )
        .then((response) => response.data)
        .then((data) => {
            return Buffer.from(data.content, 'base64').toString('ascii')
        })
        .catch((error) => null)

    if (public_key == null) {
        return { statusCode: 404, body: 'No Key Found' }
    }

    let verifier = crypto.createVerify('RSA-SHA256')
    verifier.update(msg)
    if (verifier.verify(public_key, sig, 'base64')) {
        return requestWithAuth('DELETE /repos/{owner}/{repo}/contents/{path}', {
            owner: process.env.REPO_OWNER,
            repo: process.env.REPO_NAME,
            path: `${device_id}/out.json`,
            message: 'deleting file',
            sha: Buffer.from(msg, 'base64').toString('ascii').split(';')[0],
        })
            .then((response) => ({
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: 'Receipt processed.',
            }))
            .catch((error) => ({
                statusCode: 422,
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: 'Deletion failed.',
            }))
    } else {
        return {
            statusCode: 422,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Verification failed.',
        }
    }
}
