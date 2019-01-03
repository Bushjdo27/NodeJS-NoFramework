const _helpers = require('../../helpers');

const public = (data, callback)=>{
    if(data.method === 'get'){
        // Get the file name being requested 
        const trimmedAsset = data.trimmedPath.replace('public/','');
        if(trimmedAsset.length > 0 ){
            // Read in the asset's data
            _helpers.getStaticAsset(trimmedAsset, (err, data)=>{
                if(!err && data){
                    // Detemine the content type
                    let contentType = 'plain';
                    if(trimmedAsset.indexOf('.css') > -1){
                        contentType = 'css';
                        callback(200, data, contentType)
                    }else if( trimmedAsset.indexOf('png') > -1){
                        contentType = 'png'
                    }else if( trimmedAsset.indexOf('.jpg') > -1){
                        contentType = 'jpg'
                    }
                    else if( trimmedAsset.indexOf('.ico') > -1){
                        contentType = 'favicon'
                    }
                    callback(200, data, contentType);
                    
                }else{
                    callback(404)
                }
            })
        }else{
            
            callback(404);
        }

    }else{
        callback(500)
    }
}


module.exports = { public }; 