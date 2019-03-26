'use strict';

const { Gauge } = require('prom-client');
const Joi = require('joi');
const Hoek = require('hoek');

const Base = require('./base');

const internals = {};

internals.GC_PAUSE_TIME = 'pause_time';
internals.GC_PREFIX = 'gc_';

internals.MILLIS = 1e3;
internals.MICROS = 1e6;

internals.helpMessages = {
    min: 'GC {type} min',
    max: 'GC {type} max',
    total: 'GC {type} total'
};

module.exports = internals.GcMetric = class extends Base {

    constructor(options) {

        super(options);

        this.nativeMetrics = options.nativeMetrics;
        this._getOrCreateCompleteRecorderSet(internals.GC_PAUSE_TIME);
    }

    get optionsSchema() {

        return super.optionsSchema.keys({
            nativeMetrics: Joi.object().required()
        });
    }

    _getOrCreateRecorder(type, subtype) {

        const name = internals.GC_PREFIX + type + '_' + subtype;

        if (!this.recorders.has(name)) {
            this.recorders.set(name, new Gauge({
                name: this.prefix + name,
                registers: this.registries,
                help: Hoek.reachTemplate({ type, subtype, name }, internals.helpMessages[subtype])
            }));
        }

        return this.recorders.get(name);
    }

    _getOrCreateCompleteRecorderSet(type) {

        return {
            min: this._getOrCreateRecorder(type, 'min'),
            max: this._getOrCreateRecorder(type, 'max'),
            total: this._getOrCreateRecorder(type, 'total')
        };
    }

    _recordCompleteMetric(type, metrics, timestamp) {

        const recorders = this._getOrCreateCompleteRecorderSet(type);

        recorders.total.set(metrics.total / internals.MILLIS, timestamp);
        recorders.min.set(metrics.min / internals.MILLIS, timestamp);
        recorders.max.set(metrics.max / internals.MILLIS, timestamp);
    }

    record() {

        const now = Date.now();

        for (const gc of Object.values(this.nativeMetrics.getGCMetrics())) {
            this._recordCompleteMetric(internals.GC_PAUSE_TIME, gc.metrics, now);

            if (gc.type) {
                this._recordCompleteMetric(gc.type.toLowerCase(), gc.metrics, now);
            }
        }
    }
};
