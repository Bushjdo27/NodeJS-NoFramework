const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const helpers = require('./lib/helpers');
const { httpPort, httpsPort , envName} = require('./lib/config');
const handlers = require('./lib/handlers/handlers');

const httpServer = http.createServer(function(req, res){
    unifiedServer(req,res)
    
})

httpServer.listen(httpPort, ()=> console.log(`Server is starting at ${httpPort} in ${envName} mode`));

const httpsServerOption = {
    cert: fs.readFileSync('./https/cert.pem'),
    key: fs.readFileSync('./https/key.pem')
}
const httpsServer = https.createServer(httpsServerOption, function(req, res) {
    unifiedServer(req,res)
})


httpsServer.listen(httpsPort, ()=> console.log(`Server is starting at ${httpsPort} in ${envName} mode`));

function unifiedServer(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/\/+|\/$/g, '');
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
        
        const choosenHandler = typeof router[trimmedPath] !== 'undefined' ? router[trimmedPath] : handlers.notFound;
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
const router = {
    ping: handlers.ping,
    users: handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks
}

