const express = require('express');
const app = express();

const ips = {};
const sources = [];
app.get('/', function (req, res) {
    console.log(`received peer discovery request from ${req.ip} !`);
    if (!ips[req.ip]) {
        ips[req.ip] = true;
        sources.push({ ip: req.ip, port: 4000 });
    }
    console.log(`responding with ${JSON.stringify(sources)}`);
    res.send(sources);
})

app.listen(3000, function () {
  console.log('Peer discovery app listening on port 3000!')
})