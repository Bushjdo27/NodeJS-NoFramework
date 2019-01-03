const _data = require('../../data');
const helpers = require('../../helpers');
const {_tokens} = require('./_tokens');
const {strLengthTokenID} = require('../Constants');

const validateEmail = /\w{1,}(@gmail.com|@yahoo.com)$/;

const _users = {};
/*
    Required: phone -> get phone = queryObject ( get Method )
    @TODO : Does user signUp 
        -   Yes : make sure found user in .data 
*/
_users.get = function(data, callback){
    let { phone } = data.queryStringObject;
    phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : false;
    const token = typeof data.headers.token === 'string' && data.headers.token.trim().length === strLengthTokenID ? data.headers.token.trim() : false;
    if(phone && token) {
        _tokens.verify(token, phone, (isValid)=>{
            if(isValid){
                _data.read('users', phone, function(err, data) {
                    if(!err && data){
                        delete data.password;
                        callback(200, {data});
                    }else{
                        callback(400, {Error: 'Could not find user'})
                    }
                })
            }else{
                callback(403, {Error: 'Your token is invalid'})
            }
        })    
    }else{
        callback(400, {Error: 'Missing required field'})
    }
}
_users.post = function(data, callback){
    let {firstName, lastName, email, phone, password, tosAgreement} = data.payload;
    firstName = typeof firstName === 'string' && firstName.trim().length > 1 ? firstName.trim() : '';
    lastName = typeof lastName === 'string' && lastName.trim().length > 1 ? lastName.trim() : '';
    email = typeof email === 'string' && validateEmail.test(email) ? email.trim() : '';
    phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : '';
    password = typeof password === 'string' && password.trim().length > 8 ? password.trim() : '';
    tosAgreement = typeof tosAgreement === 'boolean' && tosAgreement ? tosAgreement : '';

    if(firstName && lastName && email && phone && password && tosAgreement){
        const hashedPassword = helpers.hash(password);
        if(hashedPassword){
            const user = {
                firstName,
                lastName,
                email,
                phone,
                password:hashedPassword,
                tosAgreement
            }
            // Make sure user is not exist 
            _data.read('users', `${phone}`, function(err, data){
                if(err){
                    _data.create('users', `${phone}`, user, function(err){
                        if(!err){
                            callback(200, {Success: true})
                        }else{
                            callback(500, {Error : 'Could not create user'})
                        }
                    })
                }else{
                    callback(400, {Error: 'User with that phone number already exiest'})
                }
            })
        }else{
            callback(400, {Error: 'Error when hashing password'})
        }
    }else{
        callback(400, {Error: "Missing required field"})
    }
}
/*
    Required : phone, password
    Optional : firstName, lastName, password, email, phone, tosAgreement
*/
_users.put = function(data, callback){
    let { firstName, lastName, password, newPassword, email, phone} = data.payload;

    firstName = typeof firstName === 'string' && firstName.trim().length > 0 ? firstName.trim() : false;
    lastName = typeof lastName === 'string' && lastName.trim().length > 0 ? lastName.trim() : false;
    password = typeof password === 'string' && password.trim().length > 7 ? password.trim() : false;
    newPassword = typeof newPassword === 'string' && newPassword.trim().length > 7 ? newPassword.trim() : false;
    email = typeof email === 'string' && email.trim().length > 0 && validateEmail.test(email) ? email.trim() : false;
    phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : false;
    const token = typeof data.headers.token === 'string' && data.headers.token.trim().length === strLengthTokenID ? data.headers.token.trim() : false;
    if(phone && token) {
        _tokens.verify(token, phone, (isValid)=>{
            if(isValid){
                _data.read('users',phone, function(err, userData){
                    if(!err && userData){
                        const isCorrectPassword = helpers.hash(password) === userData.password;
                        if(isCorrectPassword){
                            userData = {
                                ...userData,
                                firstName : firstName ? firstName : data.firstName,
                                lastName : lastName ? lastName : data.lastName,
                                email : email ? email : data.email,
                                password : newPassword ? helpers.hash(newPassword) : userData.password,
                            }
                            _data.update('users', phone, userData, function(err){
                                if(!err){
                                    callback(200, {Success: true})
                                }else{
                                    callback(500, {Error: 'Coul not update user data'})
                                }
                            })
                        }else{
                            callback(500, {Error: 'Your password is not correct'})
                        }
                    }else{
                        callback(500, {Error: 'Could not found user'})
                    }
                })

            }else{
                callback(403, {Error: 'Your token is invalid'})
            }
        })
        
    }else{
        callback(400, {Error: 'Missing required field'})
    }
}

/*
    Required: phone
    @TODO : 
        -   Check User is already exist
            -   Yes : Delete User
            -   No  : Throw Error to user
*/
_users.delete = function(data, callback){
    let { phone } = data.queryStringObject;

    phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : false;
    const token = typeof data.headers.token === 'string' && data.headers.token.trim().length === strLengthTokenID ? data.headers.token.trim() : false;
    if(phone && token) {
        _tokens.verify(token, phone, (isValid)=>{
            if(isValid){
                _data.read('users', phone, function(err, userData){
                    if(!err && data){
                        _data.delete('users', phone, function(err){
                            if(!err){
                                const userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array ? userData.checks : [];
                                const checkToDelete = userChecks.length;
                                if(checkToDelete > 0){
                                    let checkDeleted = 0;
                                    let deletionErrors = false;
                                    
                                    userChecks.forEach(checkID => {
                                        _data.delete('checks', checkID, (err)=>{
                                            if(err){
                                                deletionErrors = true;
                                            }
                                            checkDeleted++;
                                            if(checkDeleted === checkToDelete){
                                                if(!deletionErrors){
                                                    callback(200)
                                                }else{
                                                    callback(500, {Error: 'Something wrong, could not delete all check in system'})
                                                }
                                            }
                                        })
                                    });
                                }else{

                                    callback(200, {Success: true})
                                }
                            }else{
                                callback(500, {Error: 'Could not delete user'})
                            }
                        })
                    }else{
                        callback(500, {Error: 'Could not found user'})
                    }
                })
            }else{
                callback(403, {Error: 'Your token is invalid'})
            }
        })
    }else{
        callback(400, {Error: 'Missing required Field'})
    }
}

module.exports = {_users}