console.log('here I am')

onmessage = (e) => {
    console.log('Response: ' + e.data)
    postMessage('Test')
}
