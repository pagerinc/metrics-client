'use strict';

const Os = require('os');
const { Counter, Gauge } = require('prom-client');
const Base = require('./base');

class CpuMetric extends Base {
    constructor(options) {
        super(options);

        this.recorders.set('cpu_user_time', new Counter({
            name: `${this.prefix}cpu_user_time`,
            help: 'Total user CPU time spent in seconds.',
            registers: this.registries,
        }));

        this.recorders.set('cpu_user_utilization', new Gauge({
            name: `${this.prefix}cpu_user_utilization`,
            help: 'Total user CPU utilization.',
            registers: this.registries,
        }));

        this.recorders.set('cpu_system_time', new Counter({
            name: `${this.prefix}cpu_system_time`,
            help: 'Total system CPU time spent in seconds.',
            registers: this.registries,
        }));

        this.recorders.set('cpu_system_utilization', new Gauge({
            name: `${this.prefix}cpu_system_utilization`,
            help: 'Total system CPU utilization.',
            registers: this.registries,
        }));

        this.cpuUsage = this._getCpuUsage();
        this.lastRecordTime = Date.now();
    }

    _recordTime(collector, value, timestamp) {
        this.recorders.get(collector).inc(value, timestamp);
    }

    _recordUtil(collector, value, timestamp) {
        this.recorders.get(collector).set(value, timestamp);
    }

    _getCpuUsage() {
        try {
            return process.cpuUsage();
        } catch (e) {
            this.log(['debug'], 'Could not record cpu usage', e);
            return null;
        }
    }

    record() {
        const now = Date.now();
        const elapsedMilliseconds = now - this.lastRecordTime;
        const cpus = Os.cpus().length;

        const cpuUsage = this._getCpuUsage();

        if (!this.cpuUsage || !cpuUsage) {
            return;
        }

        const userTimeDelta = cpuUsage.user - this.cpuUsage.user;
        const systemTimeDelta = cpuUsage.system - this.cpuUsage.system;

        const userTimeSeconds = userTimeDelta / 1e6;
        const systemTimeSeconds = systemTimeDelta / 1e6;
        const totalCpuTimeSeconds = (userTimeSeconds + systemTimeSeconds) / cpus;
        const elapsedSeconds = elapsedMilliseconds / 1000;

        this._recordTime('cpu_user_time', userTimeSeconds, now);
        this._recordTime('cpu_system_time', systemTimeSeconds, now);
        this._recordUtil('cpu_user_utilization', userTimeSeconds / elapsedSeconds, now);
        this._recordUtil('cpu_system_utilization', systemTimeSeconds / elapsedSeconds, now);

        this.cpuUsage = cpuUsage;
        this.lastRecordTime = now;
    }
}

module.exports = CpuMetric;
