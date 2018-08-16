'use strict';

const Code = require('code');
const Lab = require('lab');
const HapiMetrics = require('../../lib/services/metrics');
const Sinon = require('sinon');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const beforeEach = lab.beforeEach;
const expect = Code.expect;
const it = lab.it;

describe('Metrics', () => {

    let client;
    let labels;
    let observe;
    let server;
    let standardMetrics;

    beforeEach(() => {

        client = {
            collectDefaultMetrics: Sinon.stub()
        };

        server = {
            route: Sinon.stub(),
            bind: Sinon.stub(),
            ext: Sinon.stub(),
            events: {
                on: Sinon.stub()
            }
        };

        labels = Sinon.stub();
        observe = Sinon.stub();
        labels.returns({ observe });
        standardMetrics = {
            http: {
                requests: {
                    duration: {
                        labels
                    },
                    buckets: {
                        labels
                    }
                }
            }
        };
    });

    it('should parse method and path correctly', () => {

        const sut = new HapiMetrics(client, standardMetrics);
        sut.register(server, {});
        sut.observe('method', '/method', 200, [0, 1]);
        expect(labels.lastCall.args[0]).to.equal('method');
        expect(labels.lastCall.args[1]).to.equal('/');
        expect(observe.callCount).to.equal(2);
    });

    it('should ignore default route', () => {

        const sut = new HapiMetrics(client, standardMetrics);
        sut.register(server, {});
        sut.observe('metrics', '/metrics', 200, [0, 1]);
        expect(labels.called).to.be.false();
    });

    it('should respect no path', () => {

        const sut = new HapiMetrics(client, standardMetrics);
        sut.register(server, {});
        sut.observe('metrics', undefined, 200, [0, 1]);
        expect(labels.lastCall.args[1]).to.equal('');
    });

    it('should respect paths', () => {

        const sut = new HapiMetrics(client, standardMetrics);
        sut.register(server, {});
        sut.observe('path1', '/subpath/path1', 200, [0, 1]);
        expect(labels.lastCall.args[1]).to.equal('/subpath/');
    });

    it('should respect no path', () => {

        const sut = new HapiMetrics(client, standardMetrics);
        sut.register(server, {});
        sut.observe('path1', '/', 200, [0, 1]);
        expect(labels.lastCall.args[1]).to.equal('/');
    });

    it('should respect periods in path', () => {

        const sut = new HapiMetrics(client, standardMetrics);
        sut.register(server, {});
        sut.observe('path1', 'example.com', 200, [0, 1]);
        expect(labels.lastCall.args[1]).to.equal('example.com');
    });
});
