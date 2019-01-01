const enviroments = {};

enviroments.staging = {
    envName: 'staging',
    httpPort: 3000,
    httpsPort: 3001,
    hashingSecret: 'ThisIsHashingSecretStagingMode'
};

enviroments.production = {
    envName: 'production',
    httpPort: 5000,
    httpsPort: 5001,
    hashingSecret: 'ThisIsHashingSecretProductionMode'
};

// Determine which enviroment was passed by command-line

const currentEnviroment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : 'staging';

// Export Enviroment

const enviromentToExport = typeof enviroments[currentEnviroment] === 'object' ? enviroments[currentEnviroment] : enviroments.staging;

module.exports = enviromentToExport;