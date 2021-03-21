const querystring = require('querystring')
// Requires the Fauna module and sets up the query module, which we can use to create custom queries.
const faunadb = require('faunadb'),
    q = faunadb.query

// Once required, we need a new instance with our secret
var client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
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

    let userInfo = context.clientContext && context.clientContext.user
    if (!userInfo) {
        return {
            statusCode: 403,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Please login to register your device.',
        }
    }

    let body = querystring.parse(event.body)

    if (body.serial == null || body.friendly == null) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Bad Request',
        }
    }

    body.serial = body.serial.toUpperCase()

    // Check format of serial
    if (!/^([0-9A-F]{12})$/.test(body.serial)) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'ERROR: Serial should be 12 characters (0-9, A-F).',
        }
    }
    // Check format of friendly
    if (!/^([0-9A-Za-z_\-]+)$/.test(body.friendly)) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'ERROR: Friendly name may only contain numbers and letters.',
        }
    }

    return client
        .query(
            q.Create(q.Collection('devices'), {
                data: {
                    serial: body.serial,
                    friendly: body.friendly,
                    user: userInfo.sub,
                },
            })
        )
        .then((resp) => ({
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: 'Device registered!',
        }))
        .catch((error) => {
            let errorText = 'Device registration failed.'
            if (error.description === 'document is not unique.') {
                errorText = 'Duplicate serial or friendly name.'
            }

            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: `${errorText}`, //Uniqueness is constrained in Fauna index.
            }
        })
}
