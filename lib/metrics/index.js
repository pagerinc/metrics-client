'use strict';

const Request = require('./request');
const GC = require('./gc');
const CPU = require('./cpu');
const EventLoop = require('./event-loop');
const Memory = require('./memory');

module.exports = {
    Request,
    GC,
    CPU,
    EventLoop,
    Memory
};
