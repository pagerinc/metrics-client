'use strict';

const { Summary, Histogram } = require('prom-client');

const Base = require('./base');

const internals = {};


internals.HTTP_REQ_DURATION_MS = 'http_request_duration_milliseconds';
internals.HTTP_REQ_BUCKET_MS = 'http_request_buckets_milliseconds';

internals.CARDINALITY_MANY = 'many';
internals.CARDINALITY_ONE = 'one';


module.exports = internals.RequestMetric = class extends Base {

    constructor(options) {

        super(options);

        this.recorders.set(internals.HTTP_REQ_DURATION_MS, new Summary({
            name: this.prefix + internals.HTTP_REQ_DURATION_MS,
            help: 'Request duration in milliseconds.',
            labelNames: ['method', 'path', 'status'],
            registers: this.registries
        }));

        this.recorders.set(internals.HTTP_REQ_BUCKET_MS, new Histogram({
            name: this.prefix + internals.HTTP_REQ_BUCKET_MS,
            help: 'Request duration buckets in milliseconds. Bucket size set to 500 and 2000 ms to enable apdex calculations with a T of 300ms',
            labelNames: ['method', 'path', 'status'],
            buckets: [100, 500, 2000],
            registers: this.registries
        }));
    }

    record({ startTime, method, path, statusCode }) {

        const parsedPath = internals.parsePath(path);
        const labels = {
            method: method.toLowerCase(),
            path: parsedPath,
            status: statusCode
        };
        const duration = internals.ms(startTime);

        this.recorders.get(internals.HTTP_REQ_DURATION_MS).observe(labels, duration);
        this.recorders.get(internals.HTTP_REQ_BUCKET_MS).observe(labels, duration);
    }

    get trigger() {

        return 'request';
    }
};


internals.ms = (start) => {

    const diff = process.hrtime(start);

    return Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
};

internals.parsePath = (path) => {

    return path
        .toLowerCase()
        .split('/')
        .map((segment) => {

            return segment === '?' ? '{?}' : segment;
        })
        .join('/');
};
