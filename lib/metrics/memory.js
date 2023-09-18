'use strict';

const { Gauge } = require('prom-client');

const Base = require('./base');

const internals = {};


internals.MEMORY_PHYSICAL = 'memory_physical';
internals.MEMORY_USED_HEAP = 'memory_heap_used';
internals.MEMORY_FREE_HEAP = 'memory_heap_free';
internals.MEMORY_MAX_HEAP = 'memory_heap_max';
internals.MEMORY_USED_NONHEAP = 'memory_nonheap_used';

module.exports = internals.CpuMetric = class extends Base {

    constructor(options) {

        super(options);

        this.recorders.set(internals.MEMORY_PHYSICAL, new Gauge({
            name: this.prefix + internals.MEMORY_PHYSICAL,
            help: 'Physical memory size in bytes.',
            registers: this.registries
        }));

        this.recorders.set(internals.MEMORY_USED_HEAP, new Gauge({
            name: this.prefix + internals.MEMORY_USED_HEAP,
            help: 'Memory heap size used in bytes.',
            registers: this.registries
        }));

        this.recorders.set(internals.MEMORY_FREE_HEAP, new Gauge({
            name: this.prefix + internals.MEMORY_FREE_HEAP,
            help: 'Memory heap size free in bytes.',
            registers: this.registries
        }));

        this.recorders.set(internals.MEMORY_MAX_HEAP, new Gauge({
            name: this.prefix + internals.MEMORY_MAX_HEAP,
            help: 'Memory heap size max in bytes.',
            registers: this.registries
        }));

        this.recorders.set(internals.MEMORY_USED_NONHEAP, new Gauge({
            name: this.prefix + internals.MEMORY_USED_NONHEAP,
            help: 'Memory non-heap size used in bytes.',
            registers: this.registries
        }));
    }

    _recordBytes(recorderName, value, timestamp) {

        this.recorders.get(recorderName).set(value, timestamp);
    }

    record() {

        let memoryUsage;

        try {
            memoryUsage = process.memoryUsage();
        }
        catch (e) {
            this.log(['debug'], 'Could not record memory usage', e);
        }

        if (memoryUsage) {
            const now = Date.now();

            this._recordBytes(internals.MEMORY_PHYSICAL, memoryUsage.rss, now);
            this._recordBytes(internals.MEMORY_USED_HEAP, memoryUsage.heapUsed, now);
            this._recordBytes(internals.MEMORY_FREE_HEAP, memoryUsage.heapTotal - memoryUsage.heapUsed, now);
            this._recordBytes(internals.MEMORY_MAX_HEAP, memoryUsage.heapTotal, now);
            this._recordBytes(internals.MEMORY_USED_NONHEAP, memoryUsage.rss - memoryUsage.heapTotal, now);
        }
    }
};
