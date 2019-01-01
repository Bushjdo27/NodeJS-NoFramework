const crypto = require('crypto');
const config = require('./config')
const helpers = {};

helpers.hash = function(str){
    if(typeof str === 'string' && str.length > 1){
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash
    }else{
        return false;
    }
}

helpers.parseToJSONObject = function(str){
    try{
        const result = JSON.parse(str);
        return result;
    }catch(e){
        return {}
    }
}

module.exports = helpers;