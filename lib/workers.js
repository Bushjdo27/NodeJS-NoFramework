// Dependencies
const fs = require('fs');
const path = require('path');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const { strLength } = require('./handlers/Constants');
const _logs = require('./_logs');
const util = require('util');
const debug = util.debuglog('workers');

// Instantiate Woker module

const workers = {};

workers.gatherAllChecks = ()=>{
    // Get all the checks
    _data.list('checks', (err, checks)=>{
        if(!err && checks && checks.length > 0){
            checks.forEach((check)=>{
                // Read in the check data
                _data.read('checks', check, (err, originalCheckData)=>{
                    if(!err && originalCheckData){
                        // Pass it to the check validator, and let the function continue or log error as needed
                        
                        workers.validateCheckData(originalCheckData);

                    }else{
                        debug('Error reading one of check\'s data ')
                    }
                })
            })
        }else{
            debug('Error: Could not find any check to process')
        }
    })
};

// Satity-check the check-data;

workers.validateCheckData = (originalCheckData) =>{

    originalCheckData = typeof originalCheckData === 'object' && originalCheckData !== null ? originalCheckData : {};

    let { id, userPhone, protocol, url, method, successCodes, timeOutSeconds} = originalCheckData;
    
    id = typeof id === 'string' && id.trim().length === strLength ? id : false;
    userPhone = typeof userPhone === 'string' && userPhone.trim().length === 10 ? userPhone : false;
    protocol = typeof protocol === 'string' && ['http', 'https'].indexOf(protocol) > -1 ? protocol : false;
    url = typeof url === 'string' && url.trim().length > 0 ? url : false;
    method = typeof method === 'string' && ['post', 'get', 'put', 'delete'].indexOf(method) > -1 ? method : false;
    successCodes = typeof successCodes === 'object' && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false;
    timeOutSeconds = typeof timeOutSeconds === 'number' && timeOutSeconds % 1 === 0 && timeOutSeconds >= 1 && timeOutSeconds <= 5 ? timeOutSeconds : false;

    // Set the key that may not be set ( if the process worker have never seen this check before)

    originalCheckData.state = typeof originalCheckData.state === 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof originalCheckData.lastChecked === 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    // If all the check pass, pass the data along to next step in the process
    if( id && userPhone && protocol && url && method && successCodes && timeOutSeconds ) {
        workers.performCheck(originalCheckData);
    }else{
        debug('Error : one of the check is not property formatted. Skipping it ')
    }
}

// Perform Check , send originalCheckData and the outcome of the check process, to the next step in the process 

workers.performCheck = (originalCheckData)=>{

    // Prepare Initial check outcome
    const checkOutCome = {
        error: false,
        responseCode: false 
    }

    // Mark that the outcome has not been set
    let outcomeSent = false;

    // Parse the hostname and path out of the original check data 
    const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);
    const hostName = parsedUrl.hostname;
    const path = parsedUrl.path;

    const requestDetails = {
        protocol: originalCheckData.protocol === 'http' ? 'http' : 'https:',
        hostname: hostName,
        method: originalCheckData.method.toUpperCase(),
        path: path,
        timeout: originalCheckData.timeOutSeconds * 1000,
    }

    // Instantiate request object
    const _moduleToUse = originalCheckData.protocol === 'http' ? http : https;

    const req = _moduleToUse.request(requestDetails, (res)=>{
        const status = res.statusCode;
        checkOutCome.responseCode = status;

        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutCome);
            outcomeSent = true;
        }
    });

    // Bind to the error event so it does not get thrown

    req.on('error', (e)=>{
        // Update the checkOutCome and pass the data along
        checkOutCome.error = {
            error: true,
            value: e
        };
        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutCome);
            outcomeSent = true;
        }
    });

    // Bind to the timeOut event 

    req.on('timeout', (e)=>{
        // Update the checkOutCome and pass the data along
        checkOutCome.error = {
            error: true,
            value: 'timeout'
        };
        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutCome);
            outcomeSent = true;
        }
    });

    // End the request 
    req.end();
}

// Process the check outcome, update the check data as needed, trigger an alert if needed
// Special logic for accomodating a check that has never been tested before ( don't alert )
workers.processCheckOutcome = (originalCheckData, checkOutCome)=>{
    // Decide if the check is considered up or down
    const state = !checkOutCome.error && checkOutCome.responseCode && originalCheckData.successCodes.indexOf(checkOutCome.responseCode) > -1 ? 'up' : 'down';

    // Decide if one alert is warranted
    let alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

    // Update the check data

    // Log the outcome
    const timeOfCheck = Date.now();

    workers.log(originalCheckData, checkOutCome, state, alertWarranted, timeOfCheck);

    const newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;

    _data.update('checks', newCheckData.id, newCheckData, (err)=>{
        if(!err){
            // Send the new check data to the next phase in the proccess if needed
            if(alertWarranted){
                workers.alerUserToStatusChange(newCheckData);
            }else{
                debug('Check outcome has not changed, no alert needed ')
            }
        }else{
            debug('Error when trying to update to one of the checks');
        }
    })
}

// Alert the user as to a change in their check status 
workers.alerUserToStatusChange = (newCheckData)=>{
    const message = `Alert : your check for : ${newCheckData.method.toUpperCase()}, ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state}`;
    helpers.sendTwillioSMS(newCheckData.userPhone, message, (err)=>{
        if(!err){
            debug(`Success : User was alerted to a status change in their check, via sms : ${message} `)
        }else{
            debug(`Error: Could not send sms alert to user who has state change in their check`)
        }
    })
}

// Workers of log

workers.log = (originalCheckData, checkOutCome, state, alertWarranted, timeOfCheck)=>{
    const logData = {
        check: originalCheckData,
        outcome: checkOutCome,
        state: state,
        alert: alertWarranted,
        time: timeOfCheck
    }
    // Convert data to string
    const logString = JSON.stringify(logData);

    // Determine the name of log file
    const logFileName = originalCheckData.id;

    // Append the log string to the file

    _logs.append(logFileName, logString, (err)=>{
        if(!err){
            debug('Logging to file successfully')
        }else{
            debug('Logging to file fails')
        }
    })
}

// Timer to execute worker-process once per minute 

workers.loop = () => {
    setInterval(()=>{
        workers.gatherAllChecks()
    }, 1000 * 60)
}


workers.rotateLogs = ()=>{
    // Looking for all log is not compress
    _logs.list(false,(err, logs)=>{
        if(!err && logs && logs.length > 0){
            logs.forEach(logname => {
                // Compress the data to a different file
                const logId = logname.replace('.log','');
                const newFileID = `${logId}-${Date.now()}`;

                _logs.compress(logId, newFileID, (err)=>{
                    if(!err){
                        // Truncate the log
                        _logs.truncate(logId, (err)=>{
                            if(!err){
                                debug('Success to truncating logfile')
                            }else{
                                debug('Fail to truncacting logfile')
                            }
                        })
                    }else{
                        debug('Error when compress one of the log file', err)
                    }
                })

            })
        }else{
            debug('Error: Could not find any log to rotate')
        }
    })
}

workers.logRotationLoop = ()=>{
    setInterval(()=>{
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24)
}

workers.init = function(){
    // Execute all the checks immediately

    workers.gatherAllChecks()

    // Call the loop so the check will execute later on

    workers.loop();

    // Compress all the log immediately

    workers.rotateLogs();

    // Call the compression loop so log will be compress later on;

    workers.logRotationLoop();

}
module.exports = workers;