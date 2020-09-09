const express = require('express')
const http = require('http')
const isIP = require('net').isIP

const app = express()

app.get('/ip/:addr', (req, res) => {
    if (isIP(req.params.addr) === 0) {
        return res.status(404).json({ msg: 'Bad Input' })
    }

    return res.status(200).json({ addr: req.params.addr })
})

http.createServer(app).listen(8000, '0.0.0.0',
    _ => { console.log('Listening on http://0.0.0.0:8000\n') })
