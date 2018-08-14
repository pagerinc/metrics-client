'use strict';

const Client = require('prom-client');
const HapiMetrics = require('../services/metrics');
const HapiHealth = require('../services/health');

const HTTP_REQ_DURATION_MS = 'http_request_duration_milliseconds';
const HTTP_REQ_BUCKET_MS = 'http_request_buckets_milliseconds';

exports.plugin = {
    register: (server, options) => {

        const standardMetrics = {
            http: {
                requests: {
                    duration: new Client.Summary({ name: HTTP_REQ_DURATION_MS, help: 'request duration in milliseconds', labelNames: ['method', 'path', 'cardinality', 'status'] }),
                    buckets: new Client.Histogram({ name: HTTP_REQ_BUCKET_MS, help: 'request duration buckets in milliseconds. Bucket size set to 500 and 2000 ms to enable apdex calculations with a T of 300ms', labelNames: ['method', 'path', 'cardinality', 'status'], buckets: [100, 500, 2000] })
                }
            }
        };

        const metrics = new HapiMetrics(Client, standardMetrics);
        const health = new HapiHealth();

        metrics.register(server, options);
        health.register(server, options);
    },
    name: 'metrics'
};
