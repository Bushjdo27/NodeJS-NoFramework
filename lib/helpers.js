const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');
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


helpers.sendTwillioSMS = function(phone, msg, callback){
    phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : false;
    msg = typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

    if(phone && msg){
        // Configure payload to request 
        const payload = {
            From: config.twilio.fromPhone,
            To: `+84${phone}`,
            Body: msg
        }
        // stringify payload
        const stringPayload = querystring.stringify(payload);

        // Configure the request details
    var requestDetails = {
        protocol : 'https:',
        hostname : 'api.twilio.com',
        method : 'POST',
        path : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
        auth : config.twilio.accountSid+':'+config.twilio.authToken,
        headers : {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(stringPayload)
        }
      };
  
      // Instantiate the request object
      var req = https.request(requestDetails,function(res){
          // Grab the status of the sent request
          var status =  res.statusCode;
          // Callback successfully if the request went through
          if(status == 200 || status == 201){
            callback(false);
          } else {
            callback('Status code returned was '+status);
          }
      });
  
      // Bind to the error event so it doesn't get thrown
      req.on('error',function(e){
        callback(e);
      });
  
      // Add the payload
      req.write(stringPayload);
  
      // End the request
      req.end();
    }else{
        callback('Given parameters were missing or invalid');
    }
}
module.exports = helpers;