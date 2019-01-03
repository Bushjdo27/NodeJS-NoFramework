const {_users} = require('./api/_users');
const {_tokens} = require('./api/_tokens');
const {_checks} = require('./api/_checks');
const {index} = require('./HTML/index');
const { favicon } = require('./HTML/favicon');
const { public } = require('./HTML/public');
const _helpers = require('../helpers')
const handlers = {};

const acceptableMethod = ['get','post','put','delete'];

/*
    ======== HTML Handler ========
*/

handlers.favicon = favicon

// ==== Index handlers

handlers.index = index;

// ==== public ---
handlers.public = public

/*
    ======== JSON API Handler ========
*/

handlers.ping = function(data, callback){
    callback(200);
}

handlers.notFound = function(data, callback){
    callback(404, {Error: 'Page Not Found'})
}


//  ---- Users handlers ----

handlers.users = function(data, callback) {
    if(acceptableMethod.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    }else{
        callback(500, {Error: 'Your method is not accept'})
    }
}

handlers._users = _users;


// ---- Tokens handlers ----


handlers.tokens = function(data, callback){
    if(acceptableMethod.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    }else{
        callback(400, {Error: 'Your method is not accept'})
    }
}

handlers._tokens = _tokens;

// ----- Checks handlers ------

handlers.checks = function(data, callback){
    if(acceptableMethod.indexOf(data.method) > -1){
        handlers._checks[data.method](data, callback)
    }else{
        callback(400, {Error: 'Your method is not valid'})
    }
}

handlers._checks = _checks

module.exports = handlers;