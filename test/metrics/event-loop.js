'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const { Registry } = require('prom-client');
const NativeMetrics = require('@newrelic/native-metrics');

const Plugin = require('../..');


const { describe, it, beforeEach, after, before } = exports.lab = Lab.script();
const expect = Code.expect;

describe('EventLoop Metrics', () => {

    let nativeMetrics;

    before(() => {

        nativeMetrics = new NativeMetrics({ timeout: 100 });
    });

    after(() => {

        nativeMetrics.unbind();
        nativeMetrics.removeAllListeners();
    });

    beforeEach(({ context }) => {

        context.registry = new Registry();
    });

    it('fails without required native-metrics', ({ context }) => {

        expect(() => {

            new Plugin.Metrics.EventLoop({
                registry: context.registry
            });
        }).to.throw();
    });

    describe('collects EventLoop metrics', () => {

        beforeEach(async ({ context }) => {

            const metric = context.metric = new Plugin.Metrics.EventLoop({
                registry: context.registry,
                nativeMetrics
            });

            await metric.record();
        });

        it('collects EventLoop min usage metric (event_loop_usage_min)', ({ context }) => {

            const metric = context.registry.getSingleMetric('event_loop_usage_min');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('event_loop_usage_min');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects EventLoop max usage metric (event_loop_usage_max)', ({ context }) => {

            const metric = context.registry.getSingleMetric('event_loop_usage_max');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('event_loop_usage_max');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects EventLoop total usage metric (event_loop_usage_total)', ({ context }) => {

            const metric = context.registry.getSingleMetric('event_loop_usage_total');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('event_loop_usage_total');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects EventLoop wait metric (event_loop_wait)', ({ context }) => {

            const metric = context.registry.getSingleMetric('event_loop_wait');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('event_loop_wait');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });
    });

});
