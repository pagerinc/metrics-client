'use strict';


const { Registry } = require('prom-client');
const NativeMetrics = require('@newrelic/native-metrics');
const Joi = require('joi');
const Hoek = require('hoek');

const Pkg = require('../package.json');

const Metrics = require('./metrics');

const internals = {
    schema: {
        interval: Joi.number().integer().positive(),
        metrics: Joi.array().items(Joi.string().valid(['cpu', 'evloop', 'gc', 'memory', 'request'])),
        endpoint: Joi.object({
            path: Joi.array().items(Joi.string()).single()
        }).unknown()
    },
    defaults: {
        interval: 15 * 1e3,
        metrics: ['cpu', 'evloop', 'gc', 'memory', 'request'],
        endpoint: {
            path: '/metrics'
        }
    },
    metrics: {
        cpu: Metrics.CPU,
        gc: Metrics.GC,
        memory: Metrics.Memory,
        evloop: Metrics.EventLoop,
        request: Metrics.Request
    }
};

exports.plugin = {
    name: 'metrics',
    version: Pkg.version,
    register: (server, options) => {

        const settings = Hoek.applyToDefaults(internals.defaults, options);

        Joi.assert(settings, internals.schema, 'Invalid metrics configuration');

        const endpointPaths = Array.isArray(settings.endpoint.path) ? settings.endpoint.path : [settings.endpoint.path];
        const nativeMetrics = new NativeMetrics({ timeout: settings.interval });
        const registry = new Registry();

        /* $lab:coverage:off$ */
        if (!nativeMetrics.bound) {
            nativeMetrics.bind(settings.interval);
        }
        /* $lab:coverage:on$ */

        server.expose('registry', registry);

        const initialisedMetrics = settings.metrics.map((metricName) => {

            return new internals.metrics[metricName](({
                registry,
                interval: settings.interval,
                nativeMetrics,
                /* $lab:coverage:off$ */
                log: (tags, ...msg) => server.log(['metrics', ...tags], ...msg)
                /* $lab:coverage:on$ */
            }));
        });

        server.events.on('request', (request) => {

            request.plugins.metrics = {
                startTime: process.hrtime()
            };
        });

        initialisedMetrics
            .filter((metric) => metric.trigger === 'request')
            .forEach((metric) => {

                server.events.on('response', (request) => {

                    if (!endpointPaths.includes(request.path)) {

                        metric.record({
                            startTime: request.plugins.metrics.startTime,
                            method: request.method,
                            path: request.path,
                            /* $lab:coverage:off$ */
                            statusCode: request.response ? request.response.statusCode : 0
                            /* $lab:coverage:on$ */
                        });
                    }
                });
            });

        const initialisedTimers = initialisedMetrics
            .filter((metric) => metric.trigger === 'timer')
            .map((metric) => {

                return setInterval(
                    () => metric.record(),
                    settings.interval
                ).unref();
            });

        server.expose('metrics', initialisedMetrics);
        server.expose('timers', initialisedTimers);


        for (const endpointPath of endpointPaths) {

            server.route({
                method: 'get',
                path: endpointPath,
                handler: (request, h) => {

                    return h.response(registry.metrics()).type('text/plain');
                },
                options: {
                    auth: !!settings.endpoint.auth,
                    tags: ['metrics']
                }
            });
        }

    }
};

exports.Metrics = Metrics;
