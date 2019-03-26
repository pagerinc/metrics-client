'use strict';

const Code = require('code');
const Lab = require('lab');
const Plugin = require('../..');
const { Registry } = require('prom-client');


const { describe, it, beforeEach } = exports.lab = Lab.script();
const expect = Code.expect;

describe('Request Metrics', () => {

    beforeEach(({ context }) => {

        context.registry = new Registry();
    });

    describe('collects Request metrics', () => {

        beforeEach(({ context }) => {

            const metric = context.metric = new Plugin.Metrics.Request({
                registry: context.registry
            });

            metric.record({
                startTime: process.hrtime(),
                statusCode: 404,
                path: '/test',
                method: 'get'
            });

            metric.record({
                startTime: process.hrtime(),
                statusCode: 404,
                path: '/test/',
                method: 'get'
            });

            metric.record({
                startTime: process.hrtime(),
                statusCode: 404,
                path: '/test/test.test/.',
                method: 'get'
            });
        });

        it('collects request duration in milliseconds (http_request_duration_milliseconds)', ({ context }) => {

            const metric = context.registry.getSingleMetric('http_request_duration_milliseconds');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('http_request_duration_milliseconds');
            expect(item.type).to.equals('summary');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects request buckets duration in milliseconds (http_request_buckets_milliseconds)', ({ context }) => {

            const metric = context.registry.getSingleMetric('http_request_buckets_milliseconds');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('http_request_buckets_milliseconds');
            expect(item.type).to.equals('histogram');
            expect(item.values).to.be.an.array().and.not.empty();
        });

    });

});
