const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');
const lib = {};
const basePath = path.join(__dirname, '..','.data');

// Create new file
lib.create = function(dir, filename, data, callback){
    fs.open(`${basePath}/${dir}/${filename}.json`, 'wx' ,function(err,fd){
        if(!err && fd){
            const stringData = JSON.stringify(data);
            fs.writeFile(fd, stringData, function(err) {
                if(!err){
                    fs.close(fd, function(err){
                        if(!err){
                            callback(false);
                        }else{
                            callback('Error when closing file')
                        }
                    })
                }else{
                    callback('Could not write file')
                }
            })
        }else{
            callback('Could not create a new file, maybe it may already exist');
        }

    })
}

// Read data from file

lib.read = function(dir, filename, callback){
    
    fs.readFile(`${basePath}/${dir}/${filename}.json`,'utf8', function(err, data){
        if(!err){
            const parsedData = helpers.parseToJSONObject(data)
            callback(false,parsedData)
        }else{
            callback(true,'Error when reading file, maybe file not exist')
        }
    })
    // fs.open(`${basePath}/${dir}/${filename}.json`, 'r', function(err, fd){
    //     if(!err && fd){
            
    //     }else{
    //         callback('Could not open file, maybe the file is not exist')
    //     }
    // })
}

// Update data 

lib.update = function(dir, filename, data, callback){
    fs.open(`${basePath}/${dir}/${filename}.json`, 'r+', function(err, fd){
        if(!err && fd){
            const stringData = JSON.stringify(data);
            fs.truncate(fd, function(err){
                if(!err){
                    fs.writeFile(fd, stringData, function(err){
                        if(!err){
                            fs.close(fd, function(err){
                                if(!err){  
                                    callback(false);
                                }else{
                                    callback('Error when closing file')
                                }
                            })
                        }else{
                            callback('Error when writting new data to file')
                        }
                    })
                }else{
                    callback('Error when truncating file')
                }
            })
        }else{
            callback('Could not open file, maybe it is not exist')
        }
    })
}

lib.delete = function(dir, filename, callback){
    fs.unlink(`${basePath}/${dir}/${filename}.json`, function(err){
        if(!err){
            callback(false);
        }else{
            callback('Could not delete file')
        }
    })
}

// List all item in directory

lib.list = function(dir, callback) {
    fs.readdir(`${basePath}/${dir}/`, (err, data)=>{
        if(!err && data && data.length > 0){
            const trimmedFileName = [];
            data.forEach((fileName)=>{
                trimmedFileName.push(fileName.replace('.json',''));
            });
            callback(false, trimmedFileName)
        }else{
            callback(err, data)
        }
    })
}
module.exports = lib;