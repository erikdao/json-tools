<p align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="jsontools logo" />
</p>

<h1 align="center">jsontools</h1>

<p align="center">
  Fast, client-only JSON workspace — beautify, minify, validate, parse.<br/>
  Live at <a href="https://jsontools.erikdao.com">jsontools.erikdao.com</a>.
</p>

<p align="center">
  <a href="https://github.com/erikdao/json-tools/actions/workflows/ci.yml">
    <img src="https://github.com/erikdao/json-tools/actions/workflows/ci.yml/badge.svg" alt="CI status" />
  </a>
</p>

---

Built with Astro 5, Preact, Tailwind v4, and CodeMirror 6. All processing runs in the browser — no server round trip.

## Local setup

Requires [Bun](https://bun.sh) 1.x.

```sh
bun install
bun dev          # http://localhost:4321
```

Other scripts:

| Command            | What it does                          |
| ------------------ | ------------------------------------- |
| `bun run build`    | Production build to `./dist`          |
| `bun run preview`  | Serve the production build locally    |
| `bun run test`     | Vitest unit tests                     |
| `bun run test:e2e` | Playwright end-to-end tests           |
| `bun run lint`     | Biome lint + format check             |
| `bun run typecheck`| `astro check` + `tsc --noEmit`        |

## License

[MIT](LICENSE) © Erik Dao
