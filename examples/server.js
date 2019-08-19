'use strict';

const Hapi = require('@hapi/hapi');
const Prometheus = require('../lib');

const startServer = async () => {

    const server = await new Hapi.Server({
        port: 3000
    });
    await server.register([
        {
            plugin: Prometheus
        }
    ]);
    await server.start();
    console.log( `Server started at ${ server.info.uri }`);
    return server;
};

module.exports = startServer();
