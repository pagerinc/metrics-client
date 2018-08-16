'use strict';

const Joi = require('joi');

const internals = {
    defaults: {
        ver: process.env.npm_package_version,
        sha: process.env.VCS_REF
    }
};

class HapiHealth {

    register(server, options) {

        // Clone defaults to prevent override
        const defaults = Object.assign({}, internals.defaults);
        const response = Object.assign(defaults, options.health_response);

        const config = {
            auth: !!options.auth,
            handler: (request, h) => h.response(response),
            response: {
                schema: Joi.object({
                    ver: Joi.string().regex(/[0-9]+(\.[0-9]+)*/).default('0.0.0'),
                    sha: Joi.string().alphanum().length(7).default('plzSet1')
                }),
                modify: true,
                options: {
                    allowUnknown: true,
                    stripUnknown: false,
                    convert: true
                }
            },
            tags: ['health']
        };

        let paths = options.health_path || ['/health', '/healthcheck'];
        paths = typeof paths === 'string' ? paths.split(',') : paths;

        paths.forEach((path) => server.route({ method: 'GET', path, config }));
    }
}

module.exports = HapiHealth;
