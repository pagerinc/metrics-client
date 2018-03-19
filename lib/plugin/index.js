'use strict';

const Client = require('prom-client');
const Metrics = require('../services/metrics').metrics;

const METRICS_DEFAULT_TIMEOUT = 5000;
const HTTP_REQ_DURATION_MS = 'http_request_duration_milliseconds';
const HTTP_REQ_BUCKET_MS = 'http_request_buckets_milliseconds';

const internals = {
    metrics: {
        http: {
            requests: {
                duration: new Client.Summary({ name: HTTP_REQ_DURATION_MS, help: 'request duration in milliseconds', labelNames: ['method', 'path', 'cardinality', 'status'] }),
                buckets: new Client.Histogram({ name: HTTP_REQ_BUCKET_MS, help: 'request duration buckets in milliseconds. Bucket size set to 500 and 2000 ms to enable apdex calculations with a T of 300ms', labelNames: ['method', 'path', 'cardinality', 'status'], buckets: [100, 500, 2000] })
            }
        }
    }
};

exports.plugin = {
    register: (server, options) => {

        const timeout = options.timeout || METRICS_DEFAULT_TIMEOUT;
        Client.collectDefaultMetrics({ timeout });

        const metricsConfig = {
            metrics: internals.metrics,
            metricsPaths: options.urls
        };
        const metricRecorder = Metrics(metricsConfig, Client);

        server.bind({ metrics: metricRecorder });
        server.ext('onRequest', (request, h) => {

            request.app.start = process.hrtime();
            return h.continue;
        });

        server.events.on('response', (request) => {

            metricRecorder.observe(request.method, request.path, request.response.statusCode, request.app.start);
        });
        metricsConfig.metricsPaths.forEach((path) => {

            server.route({
                method: 'GET',
                path,
                config: {
                    handler: (request, h) => {

                        return h.response(metricRecorder.summary()).type('text/plain');
                    }
                }
            });
        });
    },
    name: 'metrics'
};
