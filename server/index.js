const express = require('express')
const http = require('http')

const app = express()

app.get('/lookup/:addr', (req, res) => {
    res.status(200).send(req.params.addr)
})

http.createServer(app).listen(8000, '0.0.0.0',
    _ => { console.log('Listening on http://0.0.0.0:8000\n') })
