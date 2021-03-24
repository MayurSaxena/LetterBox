async function shouldOverwrite(device_id) {
    // this function checks to see if there's already an image waiting for the given device
    return fetch('/.netlify/functions/waiting', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: device_id }),
    })
        .then((resp) => resp.json())
        .then((resp_json) => {
            if (resp_json.sha) {
                //if there's any kind of sha present, that means there's something at the path
                return window.confirm(
                    "There's already an image waiting to be seen! Overwrite it?"
                )
            } else {
                return true //if there's nothing present, then we should overwrite by default
            }
        })
}

async function saveImage(device_id) {
    const token = await getToken() //get the login token
    shouldOverwrite(device_id).then((resp) => {
        if (resp) {
            //only if we're overwriting
            let body = JSON.stringify({
                id: device_id, //serial number
                data: canvas.get(0).toDataURL(), //image as png
            })

            fetch('/.netlify/functions/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, //need to be authenticated to upload
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
        //if the dropdown changes
        enableSaveButton($(this).val())
    })

    dropdown.append(
        //default option (not selectable)
        '<option selected="true" disabled>No Devices Available (are you logged in?)</option>'
    )
    const token = await getToken() //authentication required

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
                //for each {id, name}, populate the dropdown
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
        // if the selected value is null, don't allow uploading
        button.prop('disabled', true)
    } else {
        button.prop('disabled', false)
    }
}

async function registerDevice(e) {
    const token = await getToken() //authentication required to tie device to email
    fetch('/.netlify/functions/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${token}`,
        },
        body: $('#registrationForm').serialize(), //url-encoded form
    })
        .then((response) => {
            if (response.ok) {
                populateDropdown() //once device is registered, refresh the device dropdown for the account
            }
            return response.text() //status / error / success message
        })
        .then((respText) => $('#registrationStatus').text(respText))
}

function docReady() {
    populateDropdown() //when the doc is loaded, populate the dropdown menu
}

netlifyIdentity.on('login', (user) => {
    //on login
    netlifyIdentity.close() //close the dialog box
    populateDropdown() //refresh the devices
})
netlifyIdentity.on('logout', (user) => {
    netlifyIdentity.close()
    populateDropdown()
})
$(document).ready(docReady)
