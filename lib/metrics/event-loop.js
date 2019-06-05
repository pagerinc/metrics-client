'use strict';

const { Gauge } = require('prom-client');
const Joi = require('@hapi/joi');

const Base = require('./base');

const internals = {};

internals.EVENT_LOOP_USAGE = 'event_loop_usage';
internals.EVENT_LOOP_WAIT = 'event_loop_wait';

internals.MICROS = 1e6;

module.exports = internals.LoopMetric = class extends Base {

    constructor(options) {

        super(options);

        this.nativeMetrics = options.nativeMetrics;

        for (const type of ['min', 'max', 'total']) {
            const recorder = `${internals.EVENT_LOOP_USAGE}_${type}`;
            this.recorders.set(recorder, new Gauge({
                name: this.prefix + recorder,
                registers: this.registries,
                help: `Event Loop usage ${type} value`
            }));
        }

        this.recorders.set(internals.EVENT_LOOP_WAIT, new Gauge({
            name: this.prefix + internals.EVENT_LOOP_WAIT,
            help: 'Lag of event loop in seconds.',
            registers: this.registries,
            aggregator: 'average'
        }));
    }

    get optionsSchema() {

        return super.optionsSchema.keys({
            nativeMetrics: Joi.object().required()
        });
    }

    _recordQueueTime(start) {

        const delta = process.hrtime(start);
        const nanosec = delta[0] * 1e9 + delta[1];
        const seconds = nanosec / 1e9;

        this.recorders.get(internals.EVENT_LOOP_WAIT).set(seconds, Date.now());
    }

    record() {

        const loopMetrics = this.nativeMetrics.getLoopMetrics();
        const timestamp = Date.now();

        this.recorders.get(internals.EVENT_LOOP_USAGE + '_total').set(loopMetrics.total / internals.MICROS, timestamp);
        this.recorders.get(internals.EVENT_LOOP_USAGE + '_min').set(loopMetrics.min / internals.MICROS, timestamp);
        this.recorders.get(internals.EVENT_LOOP_USAGE + '_max').set(loopMetrics.max / internals.MICROS, timestamp);

        const start = process.hrtime();

        setTimeout(this._recordQueueTime.bind(this, start), 0);
    }
};
