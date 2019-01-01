const enviroments = {};

enviroments.staging = {
    envName: 'staging',
    httpPort: 3000,
    httpsPort: 3001,
    hashingSecret: 'ThisIsHashingSecretStagingMode',
    maxChecks: 5,
    twilio: {
        accountSid : 'AC91c87015bccd2a7996927b62ca82b115',
        authToken : '5185df7546142cc0921f36e6796c2cae',
        fromPhone : '+19165875210'
    }
};

enviroments.production = {
    envName: 'production',
    httpPort: 5000,
    httpsPort: 5001,
    hashingSecret: 'ThisIsHashingSecretProductionMode',
    maxChecks: 5,
    twillio: {
        fromPhone: '',
        accountSid: 'ACb3f983c016f584f75af1923eb02d62a1',
        authToken: 'f88f83c79639c570bf4aa5c3213c7e83'
    }
};

// Determine which enviroment was passed by command-line

const currentEnviroment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : 'staging';

// Export Enviroment

const enviromentToExport = typeof enviroments[currentEnviroment] === 'object' ? enviroments[currentEnviroment] : enviroments.staging;

module.exports = enviromentToExport;