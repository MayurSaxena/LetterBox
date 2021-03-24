const { request } = require('@octokit/request')
const requestWithAuth = request.defaults({
    headers: {
        authorization: process.env.GITHUB_TOKEN,
    },
})

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
    if (device_id === undefined) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Bad Request',
        }
    }

    //simply checks if file exists, and returns sha (and optionally base64'd content)
    return requestWithAuth('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: process.env.REPO_OWNER,
        repo: process.env.REPO_NAME,
        path: `${device_id}/out.json`,
    })
        .then((response) => {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sha: response.data.sha,
                    content:
                        req_body.content == 1
                            ? response.data.content
                            : undefined,
                }),
            }
        })
        .catch((error) => {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            }
        })
}
