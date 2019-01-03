const _helpers = require('../../helpers');

const favicon = (data, callback)=>{
    if(data.method === 'get'){
        _helpers.getStaticAsset('favicon.ico', (err, data)=>{
            if(!err && data){
                callback(200, data, 'favicon')
            }else{
                callback(500, undefined, undefined)
            }
        })
    }else{
        callback(405, undefined, undefined)
    }
}

module.exports = { favicon }