'use strict';

const { Summary, Histogram } = require('prom-client');
const Base = require('./base');

const HTTP_REQ_DURATION_MS = 'http_request_duration_milliseconds';
const HTTP_REQ_BUCKET_MS = 'http_request_buckets_milliseconds';

class RequestMetric extends Base {
    constructor(options) {
        super(options);

        this.recorders.set(HTTP_REQ_DURATION_MS, new Summary({
            name: `${this.prefix}${HTTP_REQ_DURATION_MS}`,
            help: 'Request duration in milliseconds.',
            labelNames: ['method', 'path', 'status'],
            registers: this.registries,
        }));

        this.recorders.set(HTTP_REQ_BUCKET_MS, new Histogram({
            name: `${this.prefix}${HTTP_REQ_BUCKET_MS}`,
            help: 'Request duration buckets in milliseconds. Bucket size set to 500 and 2000 ms to enable apdex calculations with a T of 300ms',
            labelNames: ['method', 'path', 'status'],
            buckets: [100, 500, 2000],
            registers: this.registries,
        }));
    }

    record({ startTime, method, path, statusCode }) {
        const labels = {
            method: method.toLowerCase(),
            path: this.parsePath(path),
            status: statusCode,
        };
        const duration = this.ms(startTime);

        this.recorders.get(HTTP_REQ_DURATION_MS).observe(labels, duration);
        this.recorders.get(HTTP_REQ_BUCKET_MS).observe(labels, duration);
    }

    get trigger() {
        return 'request';
    }

    ms(start) {
        const diff = process.hrtime(start);
        return Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
    }

    parsePath(path) {
        return path
            .toLowerCase()
            .split('/')
            .map(segment => (segment === '?' ? '{?}' : segment))
            .join('/');
    }
}

module.exports = RequestMetric;
