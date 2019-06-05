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

    it('should collect request metrics with wildcards in path', { plan: 23 }, async () => {

        const server = new Hapi.Server();
        await server.register({
            plugin: Plugin,
            options: {}
        });

        server.route({
            path: '/tests/{testId*2}/sub',
            method: 'GET',
            handler: (request, h) => {

                return h.response('OK');
            }
        });

        for (let i = 0; i < 10; ++i) {
            const responseTest = await server.inject({
                method: 'GET',
                url: `/tests/123${i}/sada${i}/sub`
            });

            expect(responseTest.statusCode).to.equal(200);
            expect(responseTest.result).to.equal('OK');
        }


        const response = await server.inject({
            method: 'GET',
            url: '/metrics'
        });

        expect(response.statusCode).to.equal(200);
        expect(response.result).to.contain('http_request_buckets_milliseconds_bucket{le="100",method="get",path="/tests/{?}/{?}/sub",status="200"}');
        expect(response.result).to.contain('http_request_duration_milliseconds_sum{method="get",path="/tests/{?}/{?}/sub",status="200"}');
    });

    it('should register health route with default options', async () => {

        const server = new Hapi.Server();
        await server.register({
            plugin: Plugin,
            options: {}
        });

        expect(server.match('GET', '/health')).to.be.not.null();
        expect(server.match('GET', '/healthcheck')).to.be.not.null();
    });

    it('should register health route with custom options', async () => {

        const server = new Hapi.Server();
        await server.register({
            plugin: Plugin,
            options: {
                health: {
                    path: ['/abc', '/ok']
                }
            }
        });

        expect(server.match('GET', '/health')).to.be.null();
        expect(server.match('GET', '/healthcheck')).to.be.null();
        expect(server.match('GET', '/abc')).to.be.not.null();
        expect(server.match('GET', '/ok')).to.be.not.null();
    });

    it('should returns sha and ver by /health endpoint', async () => {

        const server = new Hapi.Server();
        await server.register({
            plugin: Plugin,
            options: {}
        });

        const response = await server.inject({
            url: '/health',
            method: 'GET'
        });

        expect(response.statusCode).to.equal(200);
        expect(response.result).to.be.an.object().and.contain(['sha', 'ver']);
    });

    it('should returns custom values in response by /health endpoint', async () => {

        const server = new Hapi.Server();
        await server.register({
            plugin: Plugin,
            options: {
                health: {
                    response: {
                        abc: 100
                    }
                }
            }
        });

        const response = await server.inject({
            url: '/health',
            method: 'GET'
        });

        expect(response.statusCode).to.equal(200);
        expect(response.result).to.be.an.object().and.contain(['sha', 'ver', 'abc']);
        expect(response.result.abc).to.equal(100);
    });
});
