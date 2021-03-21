let canvas = $('#canvas')
let context = canvas.get(0).getContext('2d')
let activeColor = '#FF0000'

async function getToken() {
    const currentUser = netlifyIdentity.currentUser()
    if (!currentUser) {
        return ''
    }
    let jwt = await netlifyIdentity.refresh().then((jwt) => jwt)
    return jwt
}
