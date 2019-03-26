'use strict';

const Code = require('code');
const Lab = require('lab');
const Plugin = require('../..');
const { Registry } = require('prom-client');


const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script();
const expect = Code.expect;

describe('Memory Metrics', () => {

    beforeEach(({ context }) => {

        context.registry = new Registry();
    });

    describe('collects Memory metrics', () => {

        beforeEach(({ context }) => {

            const metric = context.metric = new Plugin.Metrics.Memory({
                registry: context.registry
            });

            metric.record();
        });

        it('collects physical memory size metric (memory_physical)', ({ context }) => {

            const metric = context.registry.getSingleMetric('memory_physical');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('memory_physical');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects memory heap size used metric (memory_heap_used)', ({ context }) => {

            const metric = context.registry.getSingleMetric('memory_heap_used');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('memory_heap_used');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects memory heap size free metric (memory_heap_free)', ({ context }) => {

            const metric = context.registry.getSingleMetric('memory_heap_free');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('memory_heap_free');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects memory heap size max metric (memory_heap_max)', ({ context }) => {

            const metric = context.registry.getSingleMetric('memory_heap_max');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('memory_heap_max');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects memory non-heap size used metric (memory_nonheap_used)', ({ context }) => {

            const metric = context.registry.getSingleMetric('memory_nonheap_used');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('memory_nonheap_used');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });
    });

    describe('when process.memoryUsage fails', () => {

        beforeEach(({ context }) => {

            context.memoryUsage = process.memoryUsage;
            process.memoryUsage = () => {

                throw new Error('TEST');
            };
        });

        afterEach(({ context }) => {

            process.memoryUsage = context.memoryUsage;
        });

        it('logs error into logger and skips write metrics', ({ context }) => {

            const metric = context.metric = new Plugin.Metrics.Memory({
                registry: context.registry,
                log: (tags, message) => {

                    expect(tags).to.be.an.array().and.contains('debug');
                    expect(message).to.be.string().and.contains('Could not record memory usage');
                }
            });

            metric.record();

            const item = context.registry.getSingleMetric('memory_nonheap_used').get();

            expect(item).to.be.an.object();
            expect(item.values).to.be.an.array().and.not.empty();
            expect(item.values[0].value).to.equal(0);
            expect(item.values[0].timestamp).to.undefined();
        });
    });

});
