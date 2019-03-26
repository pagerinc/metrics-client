'use strict';

const Code = require('code');
const Lab = require('lab');
const Hapi = require('hapi');
const Hoek = require('hoek');

const Plugin = require('..');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const expect = Code.expect;
const it = lab.it;

describe('Metrics Plugin', () => {

    it('should inject route', async () => {

        const server = new Hapi.Server();
        await server.register(Plugin);
        await server.start();

        const request = {
            method: 'GET',
            url: '/metrics'
        };

        const response = await server.inject(request);

        expect(response.statusCode).to.equal(200);
        // ensure basic nodejs stat is included as sanity check
        expect(response.result).to.contain('cpu_user_time');
    });

    it('should response path override', async () => {

        const server = new Hapi.Server();
        await server.register({
            plugin: Plugin,
            options: {
                endpoint: {
                    path: ['/another']
                },
                interval: 1000
            }
        });

        const request = {
            method: 'GET',
            url: '/metrics'
        };

        const errorRes = await server.inject(request);

        expect(errorRes.statusCode).to.equal(404);

        request.url = '/another';

        const response = await server.inject(request);

        expect(response.statusCode).to.equal(200);
        // ensure basic nodejs stat is included as sanity check
        expect(response.result).to.contain('cpu_user_time');
    });

    it('should use timer to collect metrics', async () => {

        const server = new Hapi.Server();
        await server.register({
            plugin: Plugin,
            options: {
                interval: 100,
                metrics: ['memory']
            }
        });

        await Hoek.wait(200);

        expect(server.plugins.metrics.timers).to.be.an.array().and.not.empty();
    });
});
