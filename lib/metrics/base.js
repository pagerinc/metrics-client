'use strict';

const Joi = require('@hapi/joi');

const internals = {};

module.exports = internals.Base = class {

    constructor(options) {

        const settings = Joi.attempt(options, this.optionsSchema, 'Invalid options for "' + '' + '"');

        this.recorders = new Map();
        this.registries = settings.registry;
        this.prefix = settings.prefix;
        this.settings = settings;
        this.log = settings.log ? settings.log : () => {};
    }

    get trigger() {

        return 'timer';
    }

    get optionsSchema() {

        return Joi.object({
            registry: Joi.array().items(Joi.object()).min(1).single().required(),
            prefix: Joi.string().optional().default(''),
            log: Joi.func()
        }).unknown();
    }

    record() {

    }
};
