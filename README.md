# metrics-client
Hapi-centric Prometheus Plugin and optional endpoint

Use this plugin to:
- Add an endpoint for metrics (defaults to `/metrics`)
- Add custom metrics in routes (server binds `.metrics` in request contexts)
- Run a server for worker that reports metrics from an endpoint (defaults to `/metrics` on port `3000`)

## Integration 

### Modules

Once metric-client is a Hapi-centric Prometheus Plugin. Hapi and metrics-client modules need to be installed.

```bash
npm install -S @hapi/hapi
npm install -S @pager/metrics-client
```
### Usage 

Sample usage for metrics-client server 

```js
'use strict';

const Hapi = require('@hapi/hapi');
const Metrics = require('@pager/metrics-client');

const startServer = async () => {

    const server = await new Hapi.Server({
        port: 3000
    });
    await server.register([
        {
            plugin: Metrics
        }
    ]);
    await server.start();
    console.log( `Server started at ${ server.info.uri }`);
    return server;
};

module.exports = startServer();
```

### Annotations

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: {{ .Values.service.internalPort | quote }}
```

### Readiness and Liveness

Readiness probes are designed to let Kubernetes know when your app is ready to serve traffic. Similarly, liveness probes let Kubernetes know if your app is alive or dead. Metric-client plugin is also supports health check and needs to be added below code to the deployment file under container details. 

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: {{ .Values.service.internalPort }} 
  initialDelaySeconds: 15
  timeoutSeconds: 1
readinessProbe:
  httpGet:
    path: /health
    port: {{ .Values.service.internalPort }}
  initialDelaySeconds: 15
  timeoutSeconds: 1
```

### Internal Ports 

Prometheus server discovery is going to search running server on default server port 3000. Thus, metrics-client must start at default port 3000. If the server is not already running on port 3000, it can easily be added below code under containers detail.  

```yaml
env:
  - name: PORT
  value: "3000"
```

## References

### Health vs Metrics endpoint

Health endpoint is designed to provide information about a readiness and liveness of the serve. On the other hand, metrics endpoint provides information about the performance of the server such as load time, response time, memory usage, CPU usage etc. 

### Metrics List 

CPU
---
cpu_user_time
cpu_user_utilization
cpu_system_time
cpu_system_utilization

Event Loop
----------
event_loop_usage
event_loop_wait

Memory
------
memory_physical
memory_heap_used
memory_heap_free
memory_heap_max
memory_nonheap_used

HTTP Request 
------------
http_request_duration_milliseconds
http_request_buckets_milliseconds

Garbage Collector
-----------------
gc_pause_time_min
gc_pause_time_max
gc_pause_time_total

gc_scavenge_min
gc_scavenge_max
gc_scavenge_total

gc_marksweepcompact_min
gc_marksweepcompact_max
gc_marksweepcompact_total

gc_incrementalmarking_min
gc_incrementalmarking_max
gc_incrementalmarking_total

