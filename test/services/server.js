'use strict';

const Code = require('code');
const Lab = require('lab');
const Server = require('../../lib/services/server').server;
const Client = require('prom-client');

const lab = exports.lab = Lab.script();
const afterEach = lab.afterEach;
const describe = lab.describe;
const expect = Code.expect;
const it = lab.it;

describe('Server', () => {

    afterEach(() => {

        Client.register.clear();
    });

    it('should start server', async () => {

        const server = await Server.startServer();

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

    it('should error', () => {

        expect(Server.startServer({
            defaults: {
                port: 3000
            },
            plugin: {
                register: (srv, options) => {

                    throw new Error('intentional');
                },
                name: 'error'
            }
        })).to.reject(Error, 'intentional');
    });
});
