# Publishing

This repo is prepared for Visual Studio Marketplace web upload as
`tngo.copy-problem-context-agent`.

## Package Identity

- Display name: `Copy Problem Context Agent`
- Publisher: `tngo`
- Package name: `copy-problem-context-agent`
- Extension ID: `tngo.copy-problem-context-agent`
- Current version: `0.0.3`
- VSIX filename: `copy-problem-context-agent-0.0.3.vsix`

## Prerequisites

- A Marketplace publisher at https://marketplace.visualstudio.com/manage.
- The publisher ID must match `publisher` in `package.json`.
- A Microsoft account with permission to manage that publisher.

## Validate

```sh
npm ci
npm test
npm run package:vsix
npm run package:list
```

Install the generated VSIX locally before the first publish:

```sh
code --install-extension ./copy-problem-context-agent-0.0.3.vsix --force
```

Verify both commands from the Command Palette:

- `Copy Problem Context Agent: Copy for Agent`
- `Copy Problem Context Agent: Copy and Run in Terminal`

## Upload

1. Open https://marketplace.visualstudio.com/manage.
2. Sign in with the Microsoft account that manages the `tngo` publisher.
3. Select the `tngo` publisher.
4. Add or update the extension.
5. Upload `copy-problem-context-agent-0.0.3.vsix` from this repo root.
6. Confirm the extension ID is `tngo.copy-problem-context-agent`.
7. Review the README, icon, license, repository links, and version.
8. Submit and wait for Marketplace validation to finish.
