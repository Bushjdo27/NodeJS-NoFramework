/*
    Server related task
*/

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const helpers = require('./helpers');
const { httpPort, httpsPort , envName} = require('./config');
const handlers = require('./handlers/handlers');

// Instantiate Server module object;

const server = {};


server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req,res)
    
})


server.httpsServerOption = {
    cert: fs.readFileSync(path.join(__dirname, '..', 'https/cert.pem')),
    key: fs.readFileSync(path.join(__dirname,'..', 'https/key.pem'))
}
server.httpsServer = https.createServer(server.httpsServerOption, function(req, res) {
    server.unifiedServer(req,res)
})


server.unifiedServer = function(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const trimmedPath = pathname.replace(/\/+|\/$/g, '');
    const method = req.method.toLowerCase();

    const queryStringObject = parsedUrl.query;
    const headers = req.headers;

    const decoder = new StringDecoder('utf-8');
    let bufferString = ''; 

    req.on('data', function(chunk){
        bufferString += decoder.write(chunk);
    })
    req.on('end',function(){
        bufferString += decoder.end();
        
        const choosenHandler = typeof server.router[trimmedPath] !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
        const data = {
            method,
            queryStringObject,
            trimmedPath,
            headers,
            payload: helpers.parseToJSONObject(bufferString)
        }
        choosenHandler(data, function(statusCode, payload) {
            statusCode = typeof statusCode === 'number' ? statusCode : 200;
            payload = typeof payload === 'object' ? payload : {};

            res.writeHead(statusCode, {
                'Content-Type': 'application/json'
            });
            payload = JSON.stringify(payload)
            res.end(payload);
        })
        
    });
}
server.router = {
    ping: handlers.ping,
    users: handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks
}


server.init = function(){
    
    // Start HTTP server

    server.httpServer.listen(httpPort, ()=> console.log(`Server is starting at ${httpPort} in ${envName} mode`));

    // Start HTTPS server

    server.httpsServer.listen(httpsPort, ()=> console.log(`Server is starting at ${httpsPort} in ${envName} mode`));
}

module.exports = server;

