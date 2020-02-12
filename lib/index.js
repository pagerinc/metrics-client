'use strict';


const { Registry } = require('prom-client');
const NativeMetrics = require('@newrelic/native-metrics');
const Joi = require('@hapi/joi');
const Hoek = require('@hapi/hoek');

const Pkg = require('../package.json');

const Metrics = require('./metrics');

const internals = {
    defaults: {
        interval: 15 * 1e3,
        metrics: ['cpu', 'evloop', 'gc', 'memory', 'request'],
        endpoint: {
            path: '/metrics'
        },
        health: {
            path: ['/health', '/healthcheck'],
            response: {
                ver: process.env.npm_package_version ? process.env.npm_package_version : '0.0.0',
                sha: process.env.VCS_REF ? process.env.VCS_REF : '0000000',
                buildDate: process.env.BUILD_DATE ? process.env.BUILD_DATE : '1970-01-01T00:00:00Z',
                nodeVer: process.versions.node,
                npmVer: process.env.npm_config_user_agent ? process.env.npm_config_user_agent
                    .split(' ')
                    .reduce((result, value) => {

                        if (result === '0.0.0') {
                            const parsed = /npm\/([0-9]+(\.[0-9]+)*)/i.exec(value);
                            if (parsed) {
                                result = parsed[1];
                            }
                        }

                        return result;
                    }, '0.0.0') : '0.0.0'
            }
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

exports.validateSettings = (settings) => {

    const schema = Joi.object({
        interval: Joi.number().integer().positive(),
        metrics: Joi.array().items(Joi.string().valid('cpu', 'evloop', 'gc', 'memory', 'request')),
        endpoint: Joi.object({
            path: Joi.array().items(Joi.string()).single()
        }).unknown(),
        health: Joi.object({
            path: Joi.array().items(Joi.string()).single(),
            auth: Joi.any(),
            response: Joi.object().unknown()
        })
    });

    const { error, value } = schema.validate(settings);

    if (error) {

        throw error;
    }

    return value;
};

exports.plugin = {
    name: 'metrics',
    version: Pkg.version,
    register: (server, options) => {

        const settings = Hoek.applyToDefaults(internals.defaults, options);

        const validatedSettings = this.validateSettings(settings);

        const endpointPaths = validatedSettings.endpoint.path;
        const nativeMetrics = new NativeMetrics({ timeout: validatedSettings.interval });
        const registry = new Registry();

        /* $lab:coverage:off$ */
        if (!nativeMetrics.bound) {
            nativeMetrics.bind(validatedSettings.interval);
        }
        /* $lab:coverage:on$ */

        server.expose('registry', registry);

        const initialisedMetrics = validatedSettings.metrics.map((metricName) => {

            return new internals.metrics[metricName](({
                registry,
                interval: validatedSettings.interval,
                nativeMetrics,
                /* $lab:coverage:off$ */
                log: (tags, ...msg) => server.log(['metrics', ...tags], ...msg)
                /* $lab:coverage:on$ */
            }));
        });

        server.ext('onRequest', (request, h) => {

            request.plugins.metrics = {
                startTime: process.hrtime()
            };

            return h.continue;
        });

        initialisedMetrics
            .filter((metric) => metric.trigger === 'request')
            .forEach((metric) => {

                server.events.on('response', (request) => {

                    if (!endpointPaths.includes(request.path)) {

                        const startTime = Hoek.reach(request, 'plugins.metrics.startTime');

                        /* $lab:coverage:off$ */
                        if (startTime) {
                            /* $lab:coverage:on$ */

                            metric.record({
                                startTime,
                                method: request.method,
                                path: request.route.fingerprint,
                                /* $lab:coverage:off$ */
                                statusCode: request.response ? request.response.statusCode : 0
                                /* $lab:coverage:on$ */
                            });
                        }
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

        for (const path of settings.health.path) {

            server.route({
                method: 'GET', path, options: {
                    auth: !!settings.health.auth,
                    handler: (request, h) => h.response(settings.health.response),
                    response: {
                        schema: Joi.object({
                            ver: Joi.string().regex(/[0-9]+(\.[0-9]+)*/).default('0.0.0'),
                            nodeVer: Joi.string().regex(/[0-9]+(\.[0-9]+)*/).default('0.0.0'),
                            npmVer: Joi.string().regex(/[0-9]+(\.[0-9]+)*/).default('0.0.0'),
                            buildDate: Joi.date().iso().default('1970-01-01T00:00:00Z'),
                            sha: Joi.string().alphanum().length(7).default('0000000')
                        }),
                        modify: true,
                        options: {
                            allowUnknown: true,
                            stripUnknown: false,
                            convert: true
                        }
                    },
                    tags: ['health']
                }
            });
        }
    }
};

exports.Metrics = Metrics;
