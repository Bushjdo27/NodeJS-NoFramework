const {_tokens} = require('./_tokens');
const _data = require('../../data');
const _helpers = require('../../helpers');
const { strLengthTokenID, strLength } = require('../Constants');
const config = require('../../config');

const _checks = {};

/*
    Required Data : id
*/
_checks.get = function(data, callback){
    let { id } = data.queryStringObject;

    id = typeof id === 'string' && id.trim().length === strLength ? id.trim() : false;
    const token = typeof data.headers.token === 'string' && data.headers.token.trim().length === strLengthTokenID ? data.headers.token.trim() : false;
    
    if(id && token){
        _data.read('checks', id, (err,checkData)=>{
            if(!err && checkData){
                _tokens.verify(token, checkData.userPhone, (isValid)=>{
                    console.log(isValid)
                    if(isValid){
                        callback(200, checkData)
                    }else{
                        callback(403, {Error: 'Your token is not valid'})
                    }
                })
            }else{
                callback(400, {Error: 'Could not find check, please check again'})
            }
        })
    }else{
        callback(400, {Error: 'Your id or token is not valid'})
    }
}

/*
    Required data : protocol (http, https), url, method, successCodes (dang Array), timeOutSeconds
*/
_checks.post = function(data, callback){
    let {protocol, url, method, successCodes, timeOutSeconds } = data.payload;
    protocol = typeof protocol === 'string' && ['https','http'].indexOf(protocol) > -1 ? protocol : false;
    url = typeof url === 'string' && url.trim().length > 0 ? url.trim() : false;
    method = typeof method === 'string' && ['post','get','put','delete'].indexOf(method) > -1 ? method : false;
    successCodes = typeof successCodes === 'object' && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false;
    timeOutSeconds = typeof timeOutSeconds === 'number' &&  timeOutSeconds % 1 === 0 && timeOutSeconds >= 1 && timeOutSeconds <= 5 ? timeOutSeconds : false;

    const token = typeof data.headers.token === 'string' && data.headers.token.trim().length === strLengthTokenID ? data.headers.token.trim() : false;
    //console.log(token)
    if(protocol, url, method, successCodes, timeOutSeconds){
        if(token){
            _data.read('tokens', token, (err, tokenData)=>{
                if(!err && tokenData){
                    const userPhone = tokenData.phone;
                    _data.read('users',userPhone, (err, userData)=>{
                        if(!err && userData){
                            userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array  ? userData.checks : [];
                            if(userChecks.length < config.maxChecks){
                                const checkId = _helpers.createRandomCharacter(strLength);

                                const checkObject = {
                                    id: checkId,
                                    userPhone,
                                    protocol,
                                    url,
                                    method,
                                    successCodes,
                                    timeOutSeconds
                                }
                                _data.create('checks', checkId, checkObject, (err)=>{
                                    if(!err){
                                        userData.checks = userChecks;
                                        userData.checks.push(checkId);
                                        _data.update('users',userPhone, userData, (err)=>{
                                            if(!err){
                                                callback(200, checkObject)
                                            }else{
                                                callback(500, {Error: 'Could not update user data with new check'})
                                            }
                                        })
                                    }else{
                                        callback(500, {Error: 'Could not create new checks'})
                                    }
                                })
                            }else{
                                callback(400, {Error: `The User already has maximum number of check ( ${config.maxChecks} )`})
                            }

                        }else{
                            callback(403)
                        }
                    })
                }else{
                    callback(403, {Error: 'Could not find token'})
                }
            })
        }else{
            callback(400, {Error: 'Token is missing or invalid '})
        }
    }else{
        callback(400, {Error: 'Missing required input or input are invalid'})
    }
}

/*
    Required data : id
    Optional : protocol, url, method, successCodes, timeOutSeconds ( one of them must be set )
*/
_checks.put = function(data, callback){

    let {id, protocol, url, method, successCodes, timeOutSeconds} = data.payload;
    id = typeof id === 'string' && id.trim().length === strLength ? id.trim() : false;
    protocol = typeof protocol === 'string' && ['https','http'].indexOf(protocol) > -1 ? protocol : false;
    url = typeof url === 'string' && url.trim().length > 0 ? url.trim() : false;
    method = typeof method === 'string' && ['post','get','put','delete'].indexOf(method) > -1 ? method : false;
    successCodes = typeof successCodes === 'object' && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false;
    timeOutSeconds = typeof timeOutSeconds === 'number' &&  timeOutSeconds % 1 === 0 && timeOutSeconds >= 1 && timeOutSeconds <= 5 ? timeOutSeconds : false;

    const token = typeof data.headers.token === 'string' && data.headers.token.trim().length === strLengthTokenID ? data.headers.token : false;

    if(id && token){
        _data.read('checks', id, (err, checkData)=>{
            if(!err && checkData){
                _tokens.verify(token, checkData.userPhone, (isValid)=>{
                    if(isValid){
                        checkData = {
                            ...checkData,
                            protocol: protocol ? protocol : checkData.protocol,
                            url: url ? url : checkData.url,
                            method: method ? method : checkData.method,
                            successCodes: successCodes ? successCodes : checkData.successCodes,
                            timeOutSeconds: timeOutSeconds ? timeOutSeconds : checkData.timeOutSeconds,
                        }

                        _data.update('checks', id, checkData, (err)=>{
                            if(!err){
                                callback(200, {checkData})
                            }else{
                                callback(500, {Error: 'Could not update data for check'})
                            }
                        })
                    }else{
                        callback(403, { Error: 'Missing Token or Token is invalid'})
                    }
                })
            }else{
                callback(500, {Error: 'Could not find the check'})
            }
        })
    }else{
        callback(400, {Error: 'Missing required field'})
    }

}

/*
    Required : id
*/
_checks.delete = function(data, callback){
    let { id } = data.queryStringObject;

    id = typeof id === 'string' && id.trim().length === strLength ? id.trim() : false
    const token = typeof data.headers.token === 'string' && data.headers.token.trim().length === strLengthTokenID ? data.headers.token.trim() : false;
    if(id && token){
        _data.read('checks', id, (err, checkData)=>{
            if(!err && checkData){
                _tokens.verify(token, checkData.userPhone, (isValid)=>{
                    if(isValid){
                        _data.delete('checks', id, (err)=>{
                            if(!err){
                                _data.read('users', checkData.userPhone, (err , userData)=>{
                                    if(!err && userData){
                                        const indexOfCheck = userData.checks.indexOf(id);
                                        if(indexOfCheck > -1){
                                            userData.checks.splice(indexOfCheck, 1);

                                            _data.update('users', checkData.userPhone, userData, (err)=>{
                                                if(!err){
                                                    callback(200, {Success: true})
                                                }else{
                                                    callback(500, {Error: 'Could not update new data for user'})
                                                }
                                            })
                                        }else{
                                            callback(500, {Error: 'Could not delete check in list -> because not find the check in list'})
                                        }
                                    }else{
                                        callback(400, {Error: 'Could not find user'})
                                    }
                                })
                            }else{
                                callback(500, {Error: 'Could not delete the check'})
                            }
                        })
                    }else{
                        callback(403, {Error: 'Missing token or token has been expired'})
                    }
                })
            }else{
                callback(400, {Error: 'Could not find check'})
            }
        })
    }else{
        callback(400, {Error: 'Missing required field'})
    }
}




module.exports = {_checks}