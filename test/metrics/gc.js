'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Plugin = require('../..');
const { Registry } = require('prom-client');


const { describe, it, beforeEach } = exports.lab = Lab.script();
const expect = Code.expect;

describe('GC Metrics', () => {

    beforeEach(({ context }) => {

        context.registry = new Registry();
    });

    it('fails without required native-metrics', ({ context }) => {

        expect(() => {

            new Plugin.Metrics.GC({
                registry: context.registry
            });
        }).to.throw();
    });

    describe('collects GC metrics', () => {

        beforeEach(async ({ context }) => {

            const metric = context.metric = new Plugin.Metrics.GC({
                registry: context.registry,
                nativeMetrics: {
                    getGCMetrics: () => {

                        return {
                            default: {
                                type: null,
                                metrics: {
                                    total: 200,
                                    min: 100,
                                    max: 120,
                                    count: 3,
                                    sumOfSquares: 4000
                                }
                            }
                        };
                    }

                }
            });

            await metric.record();
        });

        it('collects GC min pause time metric (gc_pause_time_min)', ({ context }) => {

            const metric = context.registry.getSingleMetric('gc_pause_time_min');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('gc_pause_time_min');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects GC max pause time metric (gc_pause_time_max)', ({ context }) => {

            const metric = context.registry.getSingleMetric('gc_pause_time_max');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('gc_pause_time_max');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects GC total pause time metric (gc_pause_time_total)', ({ context }) => {

            const metric = context.registry.getSingleMetric('gc_pause_time_total');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('gc_pause_time_total');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });
    });

    describe('collects special GC type (Scavenge) metrics', () => {

        beforeEach(async ({ context }) => {

            const metric = context.metric = new Plugin.Metrics.GC({
                registry: context.registry,
                nativeMetrics: {
                    getGCMetrics: () => {

                        return {
                            Scavenge: {
                                type: 'Scavenge',
                                metrics: {
                                    total: 200,
                                    min: 100,
                                    max: 120,
                                    count: 3,
                                    sumOfSquares: 4000
                                }
                            }
                        };
                    }

                }
            });

            await metric.record();
        });

        it('collects GC min (Scavenge) metric (gc_scavenge_min)', ({ context }) => {

            const metric = context.registry.getSingleMetric('gc_scavenge_min');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('gc_scavenge_min');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects GC max (Scavenge) metric (gc_scavenge_max)', ({ context }) => {

            const metric = context.registry.getSingleMetric('gc_scavenge_max');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('gc_scavenge_max');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });

        it('collects GC total (Scavenge) metric (gc_scavenge_total)', ({ context }) => {

            const metric = context.registry.getSingleMetric('gc_scavenge_total');

            expect(metric).to.be.an.object();

            const item = metric.get();

            expect(item).to.be.an.object();
            expect(item.name).to.equals('gc_scavenge_total');
            expect(item.type).to.equals('gauge');
            expect(item.values).to.be.an.array().and.not.empty();
        });
    });
});
