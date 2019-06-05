'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Plugin = require('../..');
const { Registry } = require('prom-client');


const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script();
const expect = Code.expect;

describe('CPU Metrics', () => {

    beforeEach(({ context }) => {

        context.registry = new Registry();
    });

    describe('collects CPU metrics', () => {

        beforeEach(({ context }) => {

            const metric = context.metric = new Plugin.Metrics.CPU({
                registry: context.registry
            });

            metric.record();
        });

        it('collects CPU user time metric (cpu_user_time)', ({ context }) => {

            const metric = context.registry.getSingleMetric('cpu_user_time');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('cpu_user_time');
            expect(item.type).to.equals('counter');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects CPU user time utilization (cpu_user_utilization)', ({ context }) => {

            const metric = context.registry.getSingleMetric('cpu_user_utilization');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('cpu_user_utilization');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects CPU system time metric (cpu_system_time)', ({ context }) => {

            const metric = context.registry.getSingleMetric('cpu_system_time');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('cpu_system_time');
            expect(item.type).to.equals('counter');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects CPU user system utilization (cpu_system_utilization)', ({ context }) => {

            const metric = context.registry.getSingleMetric('cpu_system_utilization');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('cpu_system_utilization');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });
    });

    describe('when process.cpuUsage fails', () => {

        beforeEach(({ context }) => {

            context.cpuUsage = process.cpuUsage;
            process.cpuUsage = () => {

                throw new Error('TEST');
            };
        });

        afterEach(({ context }) => {

            process.cpuUsage = context.cpuUsage;
        });

        it('logs error into logger and skips write metrics', ({ context }) => {

            const metric = context.metric = new Plugin.Metrics.CPU({
                registry: context.registry,
                log: (tags, message) => {

                    expect(tags).to.be.an.array().and.contains('debug');
                    expect(message).to.be.string().and.contains('Could not record cpu usage');
                }
            });

            metric.record();

            const item = context.registry.getSingleMetric('cpu_system_utilization').get();

            expect(item).to.be.an.object();
            expect(item.values).to.be.an.array().and.not.empty();
            expect(item.values[0].value).to.equal(0);
            expect(item.values[0].timestamp).to.undefined();
        });
    });



});
