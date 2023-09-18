'use strict';

const Joi = require('joi');

class Base {
    constructor(options) {
        const settings = this.validateOptions(options);

        this.recorders = new Map();
        this.registries = settings.registry;
        this.prefix = settings.prefix || '';
        this.settings = settings;
        this.log = settings.log || (() => {});
    }

    get trigger() {
        return 'timer';
    }

    validateOptions(options) {
        const schema = Joi.object({
            registry: Joi.array().items(Joi.object()).min(1).required(),
            prefix: Joi.string().optional().default(''),
            log: Joi.func(),
        }).unknown();

        return Joi.attempt(options, schema, 'Invalid options');
    }

    record() {}
}

module.exports = Base;
