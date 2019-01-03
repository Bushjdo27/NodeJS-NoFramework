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
const util = require('util');
const debug = util.debuglog('server');

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
    const trimmedPath = pathname.replace(/^\/+|\/$/g, '');
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
        let choosenHandler = typeof server.router[trimmedPath] !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
        // If the request is within public directory, use the public handlers instead
        choosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : choosenHandler 
        const data = {
            method,
            queryStringObject,
            trimmedPath,
            headers,
            payload: helpers.parseToJSONObject(bufferString)
        }
        choosenHandler(data, function(statusCode, payload, contentType) {
            // Determine the type of the content
            contentType = typeof contentType === 'string' ? contentType : 'json';
            statusCode = typeof statusCode === 'number' ? statusCode : 200;

            let payloadString = '';
            // Return the response-part that are specificed

            if(contentType === 'json'){
                res.setHeader('Content-Type', 'application/json');
                payloadString = JSON.stringify(payload);
                payload = typeof payload === 'object' ? payload : {};
            }

            if(contentType === 'html'){
                res.setHeader('Content-Type', 'text/html');
                payloadString = typeof payload === 'string' ? payload : '';
            }
            if(contentType === 'favicon'){
                res.setHeader('Content-Type', 'image/x-icon');
                payloadString = typeof payload !== 'undefined' ? payload : '';
            }
            if(contentType === 'css'){
                res.setHeader('Content-Type', 'text/css');
                payloadString = typeof payload !== 'undefined' ? payload : '';
            }
            if(contentType === 'png'){
                res.setHeader('Content-Type', 'image/png');
                payloadString = typeof payload !== 'undefined' ? payload : '';
            }
            if(contentType === 'jpg'){
                res.setHeader('Content-Type', 'image/jpg');
                payloadString = typeof payload !== 'undefined' ? payload : '';
            }
            if(contentType === 'plain'){
                res.setHeader('Content-Type', 'text/plain');
                payloadString = typeof payload !== 'undefined' ? payload : '';
            }
            // Return the response-part that are common to all content-type
            res.writeHead(statusCode);
            res.end(payloadString);

            // If the response is 200, print green otherwise print red
            if(statusCode === 200){
                debug('\x1b[32m%s\x1b[0m',`${method.toUpperCase()} / ${trimmedPath} - ${statusCode}`)
            }else{
                debug('\x1b[31m%s\x1b[0m',`${method.toUpperCase()} / ${trimmedPath} - ${statusCode}`)
            }
        })
        
    });
}
server.router = {
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    'session/create': handlers.sessionCreate,
    'session/deleted': handlers.sessionDeleted,
    'checks/all': handlers.checkList,
    'checks/create': handlers.checkCreate,
    'checks/edit': handlers.checkEdit,
    'ping': handlers.ping,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks,
    'favicon.ico': handlers.favicon,
    'public': handlers.public
}


server.init = function(){
    
    // Start HTTP server

    server.httpServer.listen(httpPort, ()=> console.log('\x1b[36m%s\x1b[0m',`Server is starting at ${httpPort} in ${envName} mode`));

    // Start HTTPS server

    server.httpsServer.listen(httpsPort, ()=> console.log('\x1b[33m%s\x1b[0m',`Server is starting at ${httpsPort} in ${envName} mode`));
}

module.exports = server;

