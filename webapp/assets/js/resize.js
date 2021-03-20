function setContextSettings(ctx) {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = activeColor
    ctx.lineWidth = parseInt($('#myslider').val())
    ctx.imageSmoothingEnabled = false
}

setContextSettings(context)

function resizeCanvas() {
    let inMemCanvas = document.createElement('canvas')
    let inMemCtx = inMemCanvas.getContext('2d')
    let container = $('#canvas-container')

    inMemCanvas.width = canvas.get(0).width
    inMemCanvas.height = canvas.get(0).height
    inMemCtx.drawImage(canvas.get(0), 0, 0)

    let maxWidth = container.width()
    let maxHeight = container.height()

    let ratio = maxWidth / 320
    if (240 * ratio > maxHeight) {
        ratio = maxHeight / 240
    }

    canvas.width(320 * ratio)
    canvas.height(240 * ratio)
    canvas.get(0).width = 320 * ratio
    canvas.get(0).height = 240 * ratio
    context.drawImage(
        inMemCanvas,
        0,
        0,
        inMemCanvas.width,
        inMemCanvas.height,
        0,
        0,
        canvas.width(),
        canvas.height()
    )
    setContextSettings(context)
    inMemCanvas.remove()
}

resizeCanvas()
window.addEventListener('resize', resizeCanvas)
