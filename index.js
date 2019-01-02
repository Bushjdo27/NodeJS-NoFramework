// Dependencies

const server = require('./lib/server');
const workers = require('./lib/workers');

// Declare the app

const app = {};

// Init function 

app.init = function(){
    // Start Server
    server.init();
    // Start Worker

    workers.init();
}

// Execute app

app.init();

// Export app ( for test )

module.exports = app;
