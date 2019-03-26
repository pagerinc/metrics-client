'use strict';

const Os = require('os');
const { Counter, Gauge } = require('prom-client');

const Base = require('./base');

const internals = {};

internals.CPU_USER_TIME = 'cpu_user_time';
internals.CPU_USER_UTILIZATION = 'cpu_user_utilization';
internals.CPU_SYSTEM_TIME = 'cpu_system_time';
internals.CPU_SYSTEM_UTILIZATION = 'cpu_system_utilization';

internals.CPUS = Os.cpus().length;
internals.MILLIS = 1e3;
internals.MICROS = 1e6;

module.exports = internals.CpuMetric = class extends Base {

    constructor(options) {

        super(options);

        this.lastCpuUsage = this._getCpuUsage();
        this.lastRecordTime = Date.now();

        this.recorders.set(internals.CPU_USER_TIME, new Counter({
            name: this.prefix + internals.CPU_USER_TIME,
            help: 'Total user CPU time spent in seconds.',
            registers: this.registries
        }));

        this.recorders.set(internals.CPU_USER_UTILIZATION, new Gauge({
            name: this.prefix + internals.CPU_USER_UTILIZATION,
            help: 'Total user CPU utilization.',
            registers: this.registries
        }));

        this.recorders.set(internals.CPU_SYSTEM_TIME, new Counter({
            name: this.prefix + internals.CPU_SYSTEM_TIME,
            help: 'Total system CPU time spent in seconds.',
            registers: this.registries
        }));

        this.recorders.set(internals.CPU_SYSTEM_UTILIZATION, new Gauge({
            name: this.prefix + internals.CPU_SYSTEM_UTILIZATION,
            help: 'Total system CPU utilization.',
            registers: this.registries
        }));
    }

    _recordTime(collector, value, timestamp) {

        this.recorders.get(collector).inc(value, timestamp);
    }

    _recordUtil(collector, value, timestamp) {

        this.recorders.get(collector).set(value, timestamp);
    }

    _getCpuUsage(lastCpuUsage) {

        try {
            return process.cpuUsage(lastCpuUsage);
        }
        catch (e) {
            this.log(['debug'], 'Could not record cpu usage', e);
            return null;
        }
    }

    record() {

        const cpuUsage = this._getCpuUsage(this.lastCpuUsage);
        this.lastCpuUsage = this._getCpuUsage();

        if (this.lastCpuUsage === null) {
            return;
        }

        const elapsedUptime = (Date.now() - this.lastRecordTime) / internals.MILLIS;
        const totalCpuTime = internals.CPUS * elapsedUptime;
        const now = Date.now();

        this.lastRecordTime = now;

        const userTime = cpuUsage.user / internals.MICROS;
        const systemTime = cpuUsage.system / internals.MICROS;
        const userUtil = userTime / totalCpuTime;
        const systemUtil  = systemTime / totalCpuTime;

        this._recordTime(internals.CPU_USER_TIME, userTime, now);
        this._recordTime(internals.CPU_SYSTEM_TIME, systemTime, now);
        this._recordUtil(internals.CPU_USER_UTILIZATION, userUtil, now);
        this._recordUtil(internals.CPU_SYSTEM_UTILIZATION, systemUtil, now);
    }
};
