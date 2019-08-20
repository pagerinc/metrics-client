# metrics-client
Hapi-centric Prometheus Plugin and optional endpoint

Use this plugin to:
- Add an endpoint for metrics (defaults to `/metrics`)
- Add custom metrics in routes (server binds `.metrics` in request contexts)
- Run a server for worker that reports metrics from an endpoint (defaults to `/metrics` on port `3000`)

## Usage

```bash
npm install -S @pager/metrics-client
```

```js
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
    console.log( `Server started at ${ server.info.uri }`);
    return server;
};

module.exports = startServer();
```
