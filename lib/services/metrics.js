'use strict';

const CARDINALITY_MANY = 'many';
const CARDINALITY_ONE = 'one';
const DEFAULT_PATH = '/metrics';

const METRICS_DEFAULT_TIMEOUT = 5000;

class HapiMetrics {
    constructor(Client, standardMetrics) {

        this.Client = Client;
        this.standardMetrics = standardMetrics;
    }

    observe(method, path, statusCode, start) {

        path = path ? path.toLowerCase() : '';

        if (!this.metricsPaths.includes(path)) {
            const duration = this.ms(start);
            const split = this.parsePath(path);
            method = method.toLowerCase();

            this.standardMetrics.http.requests.duration.labels(method, split.path, split.cardinality, statusCode).observe(duration);
            this.standardMetrics.http.requests.buckets.labels(method, split.path, split.cardinality, statusCode).observe(duration);
        }
    }

    register(server, options) {

        const timeout = options.timeout || METRICS_DEFAULT_TIMEOUT;
        this.metricsPaths = options.metrics_urls || [DEFAULT_PATH];
        this.Client.collectDefaultMetrics({ timeout });

        server.bind({ metrics: this });
        server.ext('onRequest', (request, h) => {

            request.app.start = process.hrtime();
            return h.continue;
        });

        server.events.on('response', (request) => {

            this.observe(request.method, request.path, request.response.statusCode, request.app.start);
        });

        const config = {
            auth: !!options.auth,
            handler: (request, h) => {

                return h.response(this.Client.register.metrics()).type('text/plain');
            },
            tags: ['health', 'metrics']
        };
        this.metricsPaths.forEach((path) => server.route({ method: 'GET', path, config }));
    }

    parsePath(path) {

        const ret = {
            path,
            cardinality: CARDINALITY_MANY
        };

        if (path[path.length - 1] !== '/') {
            if (!path.includes('.')) {
                ret.path = path.substr(0, path.lastIndexOf('/') + 1);
            }
            ret.cardinality = CARDINALITY_ONE;
        };

        return ret;
    }

    ms(start) {

        const diff = process.hrtime(start);
        return Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
    }
}

module.exports = HapiMetrics;
