const _helpers = require('../../helpers');



const index = (data, callback) => {

    // Prepare the data for interpolation

    const templateData = {
        'head.title': 'Uptime Monitoring - Made Simple',
        'head.description': 'We ofer free, simple uptime monitoring for HTTP/HTTPS site of all kinds, when your site down/up we will send you a text to let you know ',
        'body.class': 'index'
    }

    // Reject any request that is not get
    if(data.method === 'get'){
        // Read in a template as a string
        _helpers.getTemplate('index', templateData,(err, str)=>{
            if(!err && str){
                // Add the universal template 
                _helpers.addUniversalTemplate(str, templateData, (err, finalString)=>{
                    if(!err && finalString){
                        callback(200, finalString, 'html');
                    }else{
                        callback(500, undefined, 'html')
                    }
                })
            }else{
                callback(500, undefined, 'html');
            }
        })
    }else{
        callback(405, undefined, 'html')
    }
}


module.exports = { index };