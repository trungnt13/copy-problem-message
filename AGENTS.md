# VSCode Extension Agents

These instructions govern how to implement extensions in this repository.

## Mission
- Build extensions that are robust, correct, and fast.
- Prioritize behavior correctness and maintainability first; optimize for minimum necessary complexity and code size.

## Publishing
- Use "Chrome Control" skill
- Open `https://marketplace.visualstudio.com/manage/publishers/tngo`
- Select "Copy Problem Context Agent" extension
- More actions -> update -> navigate in the explore to correct version of VSIX file

## Non-negotiables
- Use TypeScript for all extension code unless a file already uses another language.
- Target a strict, minimal API surface: only commands, listeners, settings, and helpers needed for the requested feature.
- Never assume input shape; validate all user/content data at boundaries.
- Never block the extension host event loop with synchronous heavy work.
- Never catch errors and ignore them. Surface failures to the user or logs and fail fast when state is invalid.
- Every disposable resource must be disposed: subscriptions, file watchers, terminals, output channels, timers, and commands.

## Design rules (minimum complexity)
- Start with the simplest implementation that satisfies correctness.
- Prefer VSCode built-ins over custom code (`vscode.workspace.*`, `vscode.window.*`, `vscode.commands.*`).
- Keep modules small and single-purpose:
  - activation/registration
  - command handlers
  - utility helpers
- Avoid introducing abstractions that are not reused at least twice.
- Keep shared state explicit and minimal.
- Use early returns to avoid deep nesting.

## Correctness and robustness
- Define clear preconditions for every command/path.
- Validate:
  - active editor/model exists
  - selections are in range
  - file/type assumptions
  - filesystem operations with existence checks
- Use `await` consistently; avoid mixing callbacks with async promises.
- For every async command, add:
  - `try` block for logic
  - `catch` block that logs (`console`/`OutputChannel`) and shows a user-facing `error` message
  - `finally` cleanup when needed
- Preserve user data invariants (no data loss, no partial writes).
- Keep file edits transactional: compute, then apply one edit operation.
- Use cancellation-aware operations for any potentially long-running work.
- On activation failure, throw a clear error and unregister cleanly.

## Performance and memory
- Keep handlers O(1) or O(n) where `n` is required input size; avoid O(n²) unless proven necessary.
- Debounce frequent events (`onDidChangeTextDocument`, search/input events) to reduce churn.
- Cache expensive computations with stable keys and invalidate explicitly.
- For very large projects/files, short-circuit and offer a user warning instead of blocking UI.
- Use incremental updates where possible instead of full rescans.

## Activation and lifecycle
- Keep activation events narrow (`onLanguage`, specific commands, workspace state).
- Register all disposables in `context.subscriptions`.
- Add only lightweight startup behavior; defer heavy init until first use.
- On deactivation, assume cancellation and release all resources quickly.

## Error handling and observability
- Add structured logs with operation name and error context.
- Keep messages user-friendly, no sensitive paths or secrets.
- Use `OutputChannel` for diagnostic details and `window.showErrorMessage` for actionable feedback.

## Coding standards
- Use strict TypeScript settings.
- Keep functions short and named by behavior.
- Use `const` by default, `readonly` where applicable.
- Prefer explicit return types for exported functions.
- Avoid magic numbers; use constants with clear names.
- Ensure line-level readability with a moderate line length and small, descriptive variables.

## Security and privacy
- Never exfiltrate file contents.
- Do not execute arbitrary shell commands from user content.
- Sanitize user-provided input before using in file paths or commands.
- Never store secrets in extension state or logs.

## Completion checklist before shipping
- Feature works in both command palette and keybinding use cases.
- Correct behavior on empty state and failure paths.
- No leaked listeners/timers/disposables after commands.
- No noticeable UI freeze on typical projects.
- No known unhandled rejected promises in command flows.
