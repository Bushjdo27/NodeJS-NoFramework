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

helpers.createRandomCharacter = function(strLength){
    strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        const possibleCharacter = 'qwertyuiopzxcvbnmasdfglkjh0123498765';
        let str = '';
        for(let i = 1; i <= strLength ; i++){
            // Get random character from possibleCharacter -> Append to final string for return 
            str += possibleCharacter.charAt(Math.floor(Math.random() * possibleCharacter.length));
            
        }
        return str;
    }else{
        return false;
    }
} 

module.exports = helpers;