// Requires the Fauna module and sets up the query module, which we can use to create custom queries.
const faunadb = require('faunadb'),
    q = faunadb.query

// Once required, we need a new instance with our secret
var client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
})

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
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
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([]),
        }
    }

    let devices = await client.query(
        q.Map(
            q.Paginate(q.Match(q.Index('devices_by_user'), userInfo.sub)), //returns a list of Refs
            q.Lambda(
                'device_doc_ref',
                q.Let(
                    { device_doc: q.Get(q.Var('device_doc_ref')) },
                    {
                        id: q.Select(['data', 'serial'], q.Var('device_doc')),
                        name: q.Select(
                            ['data', 'friendly'],
                            q.Var('device_doc')
                        ),
                    }
                )
            )
        )
    )

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(devices.data),
    }
}
