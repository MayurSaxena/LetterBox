async function shouldOverwrite(device_id) {
    const token = await getToken()
    return fetch('/.netlify/functions/waiting', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: device_id }),
    })
        .then((resp) => resp.json())
        .then((resp_json) => {
            if (resp_json.sha) {
                return window.confirm(
                    "There's already an image waiting to be seen! Overwrite it?"
                )
            } else {
                return true
            }
        })
}

async function saveImage(device_id) {
    const token = await getToken()
    shouldOverwrite(device_id).then((resp) => {
        if (resp) {
            let body = JSON.stringify({
                id: device_id,
                data: canvas.get(0).toDataURL(),
            })

            fetch('/.netlify/functions/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: body,
            }).then((response) =>
                response.ok
                    ? window.alert('Image successfully sent.')
                    : window.alert('Failed to send image.')
            )
        }
    })
}

async function populateDropdown() {
    $.ajaxSetup({
        scriptCharset: 'utf-8',
        contentType: 'application/json; charset=utf-8',
    })
    let dropdown = $('#device_id-dropdown')

    dropdown.empty()

    const url = '/.netlify/functions/devices'

    dropdown.change(function () {
        enableSaveButton($(this).val())
    })

    dropdown.append(
        '<option selected="true" disabled>No Devices Available (are you logged in?)</option>'
    )
    const token = await getToken()

    $.ajax({
        dataType: 'json',
        url: url,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        },
        success: function (data) {
            if (data.length > 0) dropdown.empty()
            $.each(data, function (key, entry) {
                dropdown.append(
                    $('<option></option>')
                        .attr('value', entry.id)
                        .text(entry.name)
                )
            })
            enableSaveButton(dropdown.val())
        },
    })
}

function enableSaveButton(val) {
    let button = $('#saveImageBtn')
    if (val == null) {
        button.prop('disabled', true)
    } else {
        button.prop('disabled', false)
    }
}

async function registerDevice(e) {
    const token = await getToken()
    fetch('/.netlify/functions/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${token}`,
        },
        body: $('#registrationForm').serialize(),
    })
        .then((response) => {
            if (response.ok) {
                populateDropdown()
            }
            return response.text()
        })
        .then((respText) => $('#registrationStatus').text(respText))
}

function docReady() {
    populateDropdown()
}

netlifyIdentity.on('login', (user) => {
    netlifyIdentity.close()
    populateDropdown()
})
netlifyIdentity.on('logout', (user) => {
    netlifyIdentity.close()
    populateDropdown()
})
$(document).ready(docReady)
