const {_users} = require('./_users');
const {_tokens} = require('./_tokens');
const {_checks} = require('./_checks');
const handlers = {};


const acceptableMethod = ['get','post','put','delete'];

handlers.ping = function(data, callback){
    callback(200);
}

handlers.notFound = function(data, callback){
    callback(404, {Error: 'Page Not Found'})
}


//  ---- Users route ----

handlers.users = function(data, callback) {
    if(acceptableMethod.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    }else{
        callback(500, {Error: 'Your method is not accept'})
    }
}

handlers._users = _users;


// ---- Tokens route ----


handlers.tokens = function(data, callback){
    if(acceptableMethod.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    }else{
        callback(400, {Error: 'Your method is not accept'})
    }
}

handlers._tokens = _tokens;

// ----- Checks route ------

handlers.checks = function(data, callback){
    if(acceptableMethod.indexOf(data.method) > -1){
        handlers._checks[data.method](data, callback)
    }else{
        callback(400, {Error: 'Your method is not valid'})
    }
}

handlers._checks = _checks

module.exports = handlers;