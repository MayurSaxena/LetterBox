function shouldOverwrite(device_id) {
    return fetch('/.netlify/functions/waiting', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: device_id }),
    })
        .then((resp) => resp.text())
        .then((txt) => {
            if (txt != '') {
                return window.confirm(
                    "There's already an image waiting to be seen! Overwrite it?"
                )
            } else {
                return true
            }
        })
}

function saveImage(device_id) {
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

function populateDropdown() {
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
        '<option selected="true" disabled>No Devices Available</option>'
    )

    // Populate dropdown with list of provinces
    $.getJSON(url, function (data) {
        if (data.length > 0) dropdown.empty()
        $.each(data, function (key, entry) {
            dropdown.append(
                $('<option></option>').attr('value', entry.id).text(entry.name)
            )
        })
        enableSaveButton(dropdown.val())
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
