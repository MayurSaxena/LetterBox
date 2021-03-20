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

    let devices = [] /*[
        { name: 'friendly', id: 'serial_number' },
        { name: 'friendly2', id: 'serial_number2' },
    ]*/

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(devices),
    }
}
