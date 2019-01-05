const _helpers = require('../../helpers');

const sessionCreate = (data, callback)=>{

    // Check Request method, if not get -> reject
    
    if(data.method === 'get'){
        const templateData = {
            'head.title': 'Login to your Account',
            'head.description': 'Please enter your phone number and password to access your account',
            'body.class': 'sessionCreate',
        }
        _helpers.getTemplate('sessionCreate', templateData, (err, str)=>{
            if(!err && str){
                // Add the universal header and footer
                _helpers.addUniversalTemplate(str, templateData, (err, str)=>{
                    if(!err && str){
                        callback(200, str, 'html')
                    }else{
                        callback(500, undefined, 'html')
                    }
                })
            }else{
                callback(500, undefined, 'html')
            }
        })
    }else{
        callback(400, undefined, 'html')
    }
}


module.exports = { sessionCreate }