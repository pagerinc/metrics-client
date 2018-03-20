'use strict';

const Hapi = require('hapi');

const internals = {
    defaults: {
        port: 3000
    },
    plugin: require('../plugin')
};

const startServer = async (options) => {

    options = options || internals;
    const server = new Hapi.Server(options.defaults);

    try {
        await server.register(options.plugin);
        await server.start();
        server.log(['info'], `Server started at ${ server.info.uri }`);
        return server;
    }
    catch (err) {
        console.error(err);
        throw err;
    }
};

exports.server = {
    startServer
};
