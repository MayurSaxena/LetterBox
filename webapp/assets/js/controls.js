// Create a new Picker instance and set the parent element.
// By default, the color picker is a popup which appears when you click the parent.
var picker = new Picker({
    parent: $('#parent').get(0),
    alpha: false,
    popup: 'bottom',
    color: activeColor,
    onChange: function (c) {
        activeColor = c.rgbString
        $('#colorIndicator').get(0).style.backgroundColor = activeColor
        context.strokeStyle = activeColor
    },
})

$('#myslider').on('input change', function () {
    context.lineWidth = parseInt($(this).val())
    $('#colorIndicator').width(parseInt($(this).val()) * 1)
    $('#colorIndicator').height(parseInt($(this).val()) * 1)
})

$('#imageLoader').on('change', handleFile)

function handleFile() {
    let reader = new FileReader()

    reader.addEventListener('loadend', function (arg) {
        let src_image = new Image()

        src_image.onload = function () {
            context.drawImage(
                src_image,
                0,
                0,
                src_image.width,
                src_image.height,
                0,
                0,
                canvas.width(),
                canvas.height()
            )
        }
        src_image.src = this.result
    })

    reader.readAsDataURL(this.files[0])
}
