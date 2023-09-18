'use strict';

const { Gauge } = require('prom-client');
const Base = require('./base');

const MEMORY_PHYSICAL = 'memory_physical';
const MEMORY_USED_HEAP = 'memory_heap_used';
const MEMORY_FREE_HEAP = 'memory_heap_free';
const MEMORY_MAX_HEAP = 'memory_heap_max';
const MEMORY_USED_NONHEAP = 'memory_nonheap_used';

class MemoryMetric extends Base {
    constructor(options) {
        super(options);

        const metricConfigs = [
            { name: MEMORY_PHYSICAL, help: 'Physical memory size in bytes.' },
            { name: MEMORY_USED_HEAP, help: 'Memory heap size used in bytes.' },
            { name: MEMORY_FREE_HEAP, help: 'Memory heap size free in bytes.' },
            { name: MEMORY_MAX_HEAP, help: 'Memory heap size max in bytes.' },
            { name: MEMORY_USED_NONHEAP, help: 'Memory non-heap size used in bytes.' },
        ];

        metricConfigs.forEach((config) => {
            this.recorders.set(config.name, new Gauge({
                name: `${this.prefix}${config.name}`,
                help: config.help,
                registers: this.registries,
            }));
        });
    }

    _recordBytes(recorderName, value, timestamp) {
        this.recorders.get(recorderName).set(value, timestamp);
    }

    record() {
        try {
            const memoryUsage = process.memoryUsage();
            const now = Date.now();

            this._recordBytes(MEMORY_PHYSICAL, memoryUsage.rss, now);
            this._recordBytes(MEMORY_USED_HEAP, memoryUsage.heapUsed, now);
            this._recordBytes(MEMORY_FREE_HEAP, memoryUsage.heapTotal - memoryUsage.heapUsed, now);
            this._recordBytes(MEMORY_MAX_HEAP, memoryUsage.heapTotal, now);
            this._recordBytes(MEMORY_USED_NONHEAP, memoryUsage.rss - memoryUsage.heapTotal, now);
        } catch (e) {
            this.log(['debug'], 'Could not record memory usage', e);
        }
    }
}

module.exports = MemoryMetric;
