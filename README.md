# setup

To install dependencies:

```bash
bun install
```

To run:

```bash
bun dev
```


TODO:
- [x] logging
  - [x] be setup (OpenTelemetry Middleware)
  - [x] fe setup (OTel Web SDK + Proxy)
  - [x] axiom integration
- [ ] biome (linting setup exists, strictly enforce?)
- [ ] rpc type safety
- [ ] db sync from staging
- [ ] sentry fe
- [ ] capacitor?
- [ ] cleanup scripts in package.json

> **Note:** See [OTEL_GUIDE.md](./OTEL_GUIDE.md) for details on the Logging/Tracing setup.
