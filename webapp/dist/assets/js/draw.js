// https://stackoverflow.com/questions/16057256/draw-on-a-canvas-via-mouse-and-touch/16068068

var isIdle = true
function drawstart(event) {
    context.beginPath()
    context.moveTo(
        event.pageX - canvas.offset().left,
        event.pageY - canvas.offset().top
    )
    isIdle = false
}
function drawmove(event) {
    if (isIdle) return
    context.lineTo(
        event.pageX - canvas.offset().left,
        event.pageY - canvas.offset().top
    )
    context.stroke()
}
function drawend(event) {
    if (isIdle) return
    drawmove(event)
    isIdle = true
}

function touchstart(event) {
    drawstart(event.touches[0])
}
function touchmove(event) {
    drawmove(event.touches[0])
    event.preventDefault()
}
function touchend(event) {
    drawend(event.changedTouches[0])
}

canvas.on('touchstart', touchstart)
canvas.on('touchmove', touchmove)
canvas.on('touchend', touchend)

canvas.on('mousedown', drawstart)
canvas.on('mousemove', drawmove)
canvas.on('mouseup', drawend)
