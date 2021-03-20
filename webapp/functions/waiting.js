const { request } = require('@octokit/request')
const requestWithAuth = request.defaults({
    headers: {
        authorization: process.env.GITHUB_TOKEN,
    },
})

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' }
    }

    let req_body
    try {
        req_body = JSON.parse(event.body)
    } catch {
        return { statusCode: 400, body: 'Bad Request' }
    }

    let device_id = req_body.id
    if (device_id === undefined) {
        return { statusCode: 400, body: 'Bad Request' }
    }

    return requestWithAuth('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: process.env.REPO_OWNER,
        repo: process.env.REPO_NAME,
        path: `${device_id}/out.json`,
    })
        .then((response) => {
            return {
                statusCode: 200,
                body: response.data.sha,
            }
        })
        .catch((error) => {
            return { statusCode: 200, body: '' }
        })
}
