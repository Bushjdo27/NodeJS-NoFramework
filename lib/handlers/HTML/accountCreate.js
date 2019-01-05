const _helpers = require('../../helpers');

const accountCreate = (data, callback)=>{

    // Check Request method, if not get -> reject
    
    if(data.method === 'get'){
        const templateData = {
            'head.title': 'Create an Account',
            'head.description': 'SignUp is easy and only take a few seconds',
            'body.class': 'accountCreate',
        }
        _helpers.getTemplate('accountCreate', templateData, (err, str)=>{
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


module.exports = { accountCreate }