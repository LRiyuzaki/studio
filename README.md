# Studio (QuizCraft)

Quiz and course practice app: upload quiz questions as JSON, group them by unit, practise with instant feedback and track progress. The product brief is in [`docs/blueprint.md`](docs/blueprint.md).

## Structure

| Path | What it holds |
| --- | --- |
| `src/app/` | Next.js pages |
| `src/components/`, `src/lib/`, `src/firebase/` | UI, helpers and Firebase wiring |
| `docs/` | Blueprint and backend description |
| `firestore.rules`, `firebase.json` | Firebase configuration |

The repository root also holds an earlier Vite-style set of files (`App.tsx`, `index.tsx`, `vite.config.ts` and others). They are kept as they are until someone confirms they are unused.

## Run locally

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`.

## Configuration

Local secrets go in `.env.local`, which is ignored by git. Never commit keys.

## Status

See [`CHANGELOG.md`](CHANGELOG.md).
