# metrics-client
Hapi-centric Prometheus Plugin and optional endpoint

## Usage

Use this plugin to:
- Add an endpoint for metrics (defaults to `/metrics`)
- Add custom metrics in routes (server binds `.metrics` in request contexts)
- Run a server for worker that reports metrics from an endpoint (defaults to `/metrics` on port `3000`)
