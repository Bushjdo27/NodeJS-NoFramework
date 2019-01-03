const fs = require('fs');
const path = require('path');
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


// Get Template HTML 

helpers.getTemplate = (templateName, data,callback)=>{
    templateName = typeof templateName === 'string' && templateName.trim().length > 0 ? templateName.trim() : false;
    data = typeof data === 'object' && data !== null ? data : {};
    if(templateName){
        const templateDir = path.join(__dirname, '..', 'templates');
        fs.readFile(`${templateDir}/${templateName}.html`, 'utf8', (err, str)=>{
            if(!err && str){
                // Do interpolate on the string
                const finalString = helpers.interpolate(str, data)
                callback(false, finalString)
            }else{
                callback('Error when reading content of template file')
            }
        })

    }else{
        callback(' A valid template name was not specified')
    }
}

// Add the universal _header , _footer to a string

helpers.addUniversalTemplate = (str, data, callback) => {
    str = typeof str === 'string' && str.trim().length > 0 ? str : false;
    data = typeof data === 'object' && data !== null ? data : {};

    helpers.getTemplate('_header', data, (err, headerString)=>{
        if(!err && headerString){   
            helpers.getTemplate('_footer', data, (err, footerString)=>{
                if(!err && footerString){
                    // Merge all them together
                    const fullString = headerString+ str + footerString;
                    callback(false, fullString)
                }else{
                    callback('Could not find the footer template')
                }
            })
        }else{
            callback('Could not find the header template')
        }
    })
}

// Take a given string and a data object and find/replace all the key within it

helpers.interpolate = (str, data) => {
    str = typeof str === 'string' && str.trim().length > 0 ? str : '';
    data = typeof data === 'object' && data !== null ? data : {};

    // Add the templateGlobals do the data objet, prepending their key name with "global"
    for(let keyName in config.templateGlobals){
        if(config.templateGlobals.hasOwnProperty(keyName)){
            data[`global.${keyName}`] = config.templateGlobals[keyName]
        }
    }
    // For each key in the data object, insert its value into the string at the corresponding placeholders
    for(let key in data){
        if(data.hasOwnProperty(key) && typeof data[key] === 'string'){
            const replace = data[key];
            const find = `{${key}}`;
            str = str.replace(find, replace);
        }
    }
    //console.log(str)
    return str;
}

helpers.getStaticAsset = (filename, callback)=>{
    filename = typeof filename === 'string' && filename.trim().length > 0 ? filename.trim() : false;
    if(filename){
        const publicDir = path.join(__dirname, '..', 'public');
        fs.readFile(`${publicDir}/${filename}`, 'utf8', (err, data)=>{
            if(!err && data){
                callback(false, data);
            }else{
                callback('Error, Could not read the content of file')
            }
        })
    }else{
        callback('Error, a valid filename was not specified')
    }
}
module.exports = helpers;