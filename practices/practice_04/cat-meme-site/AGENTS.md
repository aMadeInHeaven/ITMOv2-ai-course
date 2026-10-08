# Cat Lab project instructions

## Scope

These rules apply to the whole `cat-meme-site` project.

## Before editing

- For catalog cards, form validation, XSS protection, localStorage or image fallback work, load the project skill `cat-card-tdd` and follow its acceptance scenarios.
- Keep browser and MCP validation rules in the shared `src/card-validation.mjs` module.
- Read `docs/requirements.md` before changing user-facing behavior and `docs/style-guide.md` before changing the visual system.

## Implementation invariants

- Never place user-controlled content into `innerHTML`; use DOM nodes and `textContent`.
- Accept image URLs only when they are absolute `http:` or `https:` URLs.
- Preserve semantic labels, visible keyboard focus, useful image `alt` text and the accessible image-error fallback.
- Keep the OpenCode MCP definition directly under `mcp` in `opencode.json`.

## Verification

- Run `npm run check` after changing application, skill, MCP, hook or tests.
- The check is complete only when unit tests, the production build, hook smoke test and MCP integration exchange all pass.
- Update `reflection.md` only with observations actually supported by the work or checks.
