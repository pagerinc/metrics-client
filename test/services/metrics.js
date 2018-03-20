'use strict';

const Code = require('code');
const Lab = require('lab');
const Metrics = require('../../lib/services/metrics').metrics;
const Sinon = require('sinon');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const beforeEach = lab.beforeEach;
const expect = Code.expect;
const it = lab.it;

describe('Metrics', () => {

    let subject;
    let config;
    let mockClient;

    beforeEach(() => {

        config = {
            metrics: {
                http: {
                    requests: {
                        duration: {
                            labels: Sinon.stub().returns({
                                observe: Sinon.spy()
                            })
                        },
                        buckets: {
                            labels: Sinon.stub().returns({
                                observe: Sinon.spy()
                            })
                        }
                    }
                }
            }
        };

        mockClient = { register: { metrics: Sinon.spy() } };
        subject = Metrics(config, mockClient);
    });

    it('should parse method and path correctly', () => {

        subject.observe('method', '/method', 200, [0, 1]);
        expect(config.metrics.http.requests.duration.labels.args[0][0]).to.equal('method');
        expect(config.metrics.http.requests.duration.labels.args[0][1]).to.equal('/');
    });

    it('should ignore default route', () => {

        subject.observe('metrics', '/metrics', 200, [0, 1]);
        expect(config.metrics.http.requests.duration.labels.called).to.be.false();
    });

    it('should respect no path', () => {

        subject.observe('metrics', undefined, 200, [0, 1]);
        expect(config.metrics.http.requests.duration.labels.args[0][1]).to.equal('');
    });

    it('should ignore custom metrics routes', () => {

        config.metricsPaths = ['/path1', '/path2'];
        subject = Metrics(config, mockClient);
        subject.observe('path1', '/path1', 200, [0, 1]);
        subject.observe('path2', '/path2', 200, [0, 1]);
        expect(config.metrics.http.requests.duration.labels.called).to.be.false();
    });

    it('should respect paths', () => {

        subject.observe('path1', '/subpath/path1', 200, [0, 1]);
        expect(config.metrics.http.requests.duration.labels.args[0][1]).to.equal('/subpath/');
    });

    it('should respect no path', () => {

        subject.observe('path1', '/', 200, [0, 1]);
        expect(config.metrics.http.requests.duration.labels.args[0][1]).to.equal('/');
    });

    it('should respect periods in path', () => {

        subject.observe('path1', 'example.com', 200, [0, 1]);
        expect(config.metrics.http.requests.duration.labels.args[0][1]).to.equal('example.com');
    });

    it('should call summary', () => {

        subject.summary();
        expect(mockClient.register.metrics.calledOnce).to.be.true();
    });
});
