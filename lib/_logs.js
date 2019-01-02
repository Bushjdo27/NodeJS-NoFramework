// Dependencies 

const fs = require('fs');
const path = require('path');
const zlib = require('zlib'); // compressing and decompressing file 

const basePath = path.join(__dirname, '..', '.logs')
// Container for the module
const _logs = {};

// Append a string to the file, if it does not exist, create it 
_logs.append = (filename, str, callback)=>{
    // Open the file for appending
    fs.open(`${basePath}/${filename}.log`, 'a', (err,fd)=>{
        if(!err && fd){
            // Append to the file and close it 
            fs.appendFile(fd, `${str}\n`, (err)=>{
                if(!err){
                    fs.close(fd, (err)=>{
                        if(!err){
                            callback(false);
                        }else{
                            callback('Could not close file')
                        }
                    })
                }else{
                    callback('Could not append file')
                }
            })
        }else{
            callback('Error when opening the file')
        }
    })
}

// List all the logs, and optionally include the compressed logs 
_logs.list = (includeCompressedLogs, callback)=>{
    fs.readdir(basePath, (err, data)=>{
        if(!err && data && data.length > 0){
            const trimmedFilesName = [];
            data.forEach(filename => {
                // Add the .log files
                if(filename.indexOf('.log') > -1){
                    trimmedFilesName.push(filename.replace('.log', ''));
                }
                // Add on the compress .gz file
                if(filename.indexOf('.gz.b64') > -1 && includeCompressedLogs){
                    trimmedFilesName.push(filename.replace('.gz.b64',''))
                }
            });
            callback(false, trimmedFilesName)
        }else{
            callback(err, data)
        }
    })
}
// Compress the content of .log file -> .gz.b64 file within same directory
_logs.compress = (logId, newFileId, callback)=>{
    const sourceFile = `${logId}.log`;
    const destinationFile = `${newFileId}.gz.b64`;

    fs.readFile(`${basePath}/${sourceFile}`, 'utf8', (err, data)=>{
        if(!err && data){
            // Compress the data using zlib
            zlib.gzip(data, (err, compressBufferData)=>{
                if(!err && compressBufferData){
                    fs.open(`${basePath}/${destinationFile}`, 'wx', (err, fd)=>{
                        if(!err && fd){
                            fs.writeFile(fd, compressBufferData.toString('base64'), (err)=>{
                                if(!err){
                                    fs.close(fd, (err)=>{
                                        if(!err){
                                            callback(false)
                                        }else{
                                            callback('Error when close the file, which is written completed')
                                        }
                                    })
                                }else{
                                    callback('Error when write new content file to gz file')
                                }
                            })
                        }else{
                            callback('Error when try to open file to write data compress')
                        }
                    })
                }else{
                    callback('Error when compress data')
                }
            })
        }else{
            callback('Error: Could not read file')
        }
    })
}

// Decompress the content of .gz.b64 file into string variabl

_logs.decompress = (fileId, callback)=>{
    const filename = `${fileId}.gz.b64`;
    fs.readFile(`${basePath}/${filename}`, 'utf8', (err, data)=>{
        if(!err && data){
            // decompress the data
            const inputBuffer = Buffer.from(data, 'base64');
            zlib.unzip(inputBuffer, (err, decompressedBufferData)=>{
                if(!err){
                    const str = decompressedBufferData.toString();
                    callback(false, str)
                }else{
                    callback('Error when uzip file')
                }
            })

        }else{
            callback('Error when reading file .gz.b64')
        }
    })
}

// Truncate a log file
_logs.truncate = (logId, callback)=>{
    fs.truncate(`${basePath}/${logId}.log`, 0, (err)=>{
        if(!err){
            callback(false);
        }else{ 
            callback('Error when truncate file')
        }
    })
}
module.exports = _logs;