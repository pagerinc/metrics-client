'use strict';

const Code = require('code');
const Lab = require('lab');
const Plugin = require('../../lib/plugin');
const Hapi = require('hapi');

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

        server.inject(request).then((response) => {

            expect(response.statusCode).to.equal(200);
            // ensure basic nodejs stat is included as sanity check
            expect(response.result).to.contain('nodejs_heap_size_used_bytes');
        });
    });

    it('should response path override', async () => {

        const server = new Hapi.Server();
        await server.register({
            plugin: Plugin,
            options: {
                urls: ['/another'],
                timeout: 1000
            }
        });

        const request = {
            method: 'GET',
            url: '/metrics'
        };

        server.inject(request).then((response) => {

            expect(response.statusCode).to.equal(404);
        });

        request.url = '/another';

        server.inject(request).then((response) => {

            expect(response.statusCode).to.equal(200);
            // ensure basic nodejs stat is included as sanity check
            expect(response.result).to.contain('nodejs_heap_size_used_bytes');
        });
    });
});
