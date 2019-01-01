const _data = require('../data');
const _helpers = require('../helpers');
const { strLengthTokenID } = require('./Constants');
const _tokens = {};

/*
    Required : tokenID ( id )
*/
_tokens.get = function(data, callback){
    let { id } = data.queryStringObject;
    id = typeof id === 'string' && id.trim().length === strLengthTokenID ? id.trim() : false;

    if(id){
        _data.read('tokens', id, (err, data)=>{
            if(!err && data){
                callback(200, {data})
            }else{
                callback(400, {Error: 'Could not find token, please check again'})
            }
        })
    }else{
        callback(400, {Error: 'Missing required Field'})
    }
}

/*
    Required : phone, password
*/
_tokens.post = function(data, callback){
    let {phone, password} = data.payload;
    phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : false;
    password = typeof password === 'string' && password.trim().length > 7 ? password.trim() : false;

    if(phone && password){
        // Check User is already exist
        _data.read('users',phone, function(err, userData){
            if(!err && userData){
                const isCorrectPassword = _helpers.hash(password) === userData.password;
                if(isCorrectPassword){
                    const tokenId = _helpers.createRandomCharacter(strLengthTokenID);
                    // Token will be expired after 1 hours
                    const expired = Date.now() + 1000*60*60;
                    const tokenObject = {
                        phone,
                        tokenId,
                        expired
                    }
                    _data.create('tokens', tokenId, tokenObject, function(err){
                        if(!err){
                            callback(200, {token: tokenObject})
                        }else{
                            callback(500, {Error: 'Could not create tokens'})
                        }
                    })
                }else{
                    callback(400, {Error: 'Your password is not correct, please check again'})
                }
            }else{
                callback(400, {Error: 'Could not find User, please check again phone number'})
            }
        })
        
    }else{
        callback(400, {Error: 'Missing required field'})
    }
}

/*
    Required data : id , extend
*/
_tokens.put = function(data, callback){
    let { id , extend } = data.payload;
    id = typeof id === 'string' && id.trim().length === strLengthTokenID ? id.trim() : false;
    extend = typeof extend === 'boolean' && extend ? extend : false;

    if(id && extend){
        _data.read('tokens', id, (err, data)=>{
            if(!err && data){
                const isExpired = data.expired > Date.now();
                if(isExpired){
                    data.expired = Date.now() + 1000*60*60;
                    _data.update('tokens', id, data, (err)=>{
                        if(!err){
                            callback(200, {Success: 'Your token has been extended'})
                        }else{
                            callback(500, {Error: 'Something wrong'});
                        }
                    })
                }else{
                    callback(400, {Error: 'Your token has been expired, you can not extend'})
                }
            }else{
                callback(400, {Error: 'Could not find your token'})
            }
        })
    }else{
        callback(400, {Error: 'Missing required field, please enter all of them'})
    }
}
/*
    Required data : id
*/
_tokens.delete = function(data, callback){
    let { id } = data.queryStringObject;
    id = typeof id === 'string' && id.trim().length === strLengthTokenID ? id.trim() : false;
    if(id){
        _data.read('tokens', id, (err, data)=>{
            if(!err && data){
                _data.delete('tokens', id, (err)=>{
                    if(!err){
                        callback(200, {Success: true})
                    }else{
                        callback(500, {Error: 'Could no delete token'})
                    }
                })
            }else{
                callback(400, {Error: 'Your token is not exist'})
            }
        })
    }else{
        callback(400, {Error: 'Missing required field'})
    }
}


// Verify token if token given is currently valid with one users 

_tokens.verify = function(id, phone, callback){
    _data.read('tokens', id, (err, data)=>{
        if(!err && data){
            if(data.phone === phone && data.expired > Date.now()){
                callback(true);
            }else{
                callback(false)
            }
        }else{
            callback(false)
        }
    })
}
module.exports = {_tokens}