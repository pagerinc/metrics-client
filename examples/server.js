'use strict';

const Hapi = require('@hapi/hapi');
const Metrics = require('@pager/metrics-client');

const startServer = async () => {

    const server = await new Hapi.Server({
        port: 3000
    });
    await server.register([
        {
            plugin: Metrics
        }
    ]);
    await server.start();
    server.log(`Server started at ${server.info.uri}`);
    return server;
};

module.exports = startServer();
