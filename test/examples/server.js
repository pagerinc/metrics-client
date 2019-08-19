'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Hapi = require('@hapi/hapi');

const server = require('../../examples/server.js');

const lab = exports.lab = Lab.script();
const { it, describe, beforeEach, afterEach, before } = lab;
const expect = Code.expect;

describe('Example server', () => {

    it('should start successfully', () => {
        console.log(typeof server);
    });
});
