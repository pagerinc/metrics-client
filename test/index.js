'use strict';

const Code = require('code');
const Lab = require('lab');
const Hapi = require('hapi');
const Hoek = require('hoek');

const Plugin = require('..');

const lab = exports.lab = Lab.script();
const { it, describe, beforeEach, afterEach, before } = lab;
const expect = Code.expect;

describe('Metrics Plugin', () => {

    before(() => {

        process.env.VCS_REF = '1234567';
        process.env.BUILD_DATE = '2007-02-03T04:05:06Z';
    });

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
        expect(response.result).to.be.an.object().and.contain(['sha', 'ver', 'nodeVer', 'npmVer', 'abc', 'buildDate']);
        expect(response.result.abc).to.equal(100);
    });

    describe('when unexpected or/and undefined env vars', () => {

        let processEnvDump;

        beforeEach(() => {

            processEnvDump = {
                ...process.env
            };
        });

        afterEach(() => {

            Object.assign(process.env, processEnvDump);
        });

        it('should returns 0.0.0 versions in response by /health endpoint when undefined', async () => {

            delete process.env.npm_package_version;
            delete process.env.npm_config_user_agent;
            delete process.env.VCS_REF;
            delete process.env.BUILD_DATE;
            delete require.cache[require.resolve('../')];

            const server = new Hapi.Server();
            await server.register({
                plugin: require('../'),
                options: {}
            });

            const response = await server.inject({
                url: '/health',
                method: 'GET'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.object().and.contain(['sha', 'ver', 'nodeVer', 'npmVer', 'buildDate']);
            expect(response.result.npmVer).to.equal('0.0.0');
            expect(response.result.ver).to.equal('0.0.0');
            expect(response.result.sha).to.equal('0000000');
            expect(response.result.buildDate).to.equal(new Date('1970-01-01T00:00:00.000Z'));
        });

        it('should returns 0.0.0 npm version in response by /health endpoint when version string invalid', async () => {

            process.env.npm_config_user_agent = 'node/10.10.10 asdas/213.2.2 sad sad';
            delete require.cache[require.resolve('../')];

            const server = new Hapi.Server();
            await server.register({
                plugin: require('../'),
                options: {}
            });

            const response = await server.inject({
                url: '/health',
                method: 'GET'
            });

            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.object().and.contain(['sha', 'ver', 'nodeVer', 'npmVer', 'buildDate']);
        });
    });
});
