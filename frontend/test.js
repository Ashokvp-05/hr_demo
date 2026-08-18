const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('iisnode is working! Current Node version: ' + process.version);
}).listen(process.env.PORT);