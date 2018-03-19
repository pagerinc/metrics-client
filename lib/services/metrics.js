'use strict';

const CARDINALITY_MANY = 'many';
const CARDINALITY_ONE = 'one';
const DEFAULT_PATH = '/metrics';

const internals = {
    parsePath: (path) => {

        const ret = {
            path,
            cardinality: CARDINALITY_MANY
        };

        if (path[path.length - 1] !== '/') {
            if (!path.includes('.')) {
                ret.path = path.substr(0, path.lastIndexOf('/') + 1);
            }
            ret.cardinality = CARDINALITY_ONE;
        };

        return ret;
    },
    ms: (start) => {

        const diff = process.hrtime(start);
        return Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
    }
};

exports.metrics = (metricsConfig, client) => {

    metricsConfig.metricsPaths = metricsConfig.metricsPaths || [DEFAULT_PATH];

    return {
        client,
        observe: (method, path, statusCode, start) => {

            path = path ? path.toLowerCase() : '';

            if (!metricsConfig.metricsPaths.includes(path)) {
                const duration = internals.ms(start);
                const split = internals.parsePath(path);
                method = method.toLowerCase();

                metricsConfig.metrics.http.requests.duration.labels(method, split.path, split.cardinality, statusCode).observe(duration);
                metricsConfig.metrics.http.requests.buckets.labels(method, split.path, split.cardinality, statusCode).observe(duration);
            }
        },
        summary: () => {

            return client.register.metrics();
        }
    };
};
