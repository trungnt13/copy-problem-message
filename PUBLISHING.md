# Publishing

This repo is prepared for the Visual Studio Marketplace, but publishing still
requires local publisher authentication.

Official references:

- https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- https://code.visualstudio.com/api/references/extension-manifest

## Prerequisites

- A Marketplace publisher at https://marketplace.visualstudio.com/manage.
- The publisher ID must match `publisher` in `package.json`.
- An Azure DevOps Personal Access Token with `Marketplace > Manage` scope.

Do not commit the token or paste it into chat.

## Validate

```sh
npm ci
npm test
npm run package:vsix
npm run package:list
```

Install the generated VSIX locally before the first publish:

```sh
code --install-extension ./copy-problem-context-agent-0.0.1.vsix --force
```

Verify both commands from the Command Palette:

- `Copy Problem Message: Copy With Context`
- `Copy Problem Message: Copy With Context and Run in Terminal`

## Publish

```sh
npm exec -- vsce login tngo
npm exec -- vsce publish
```

If your Marketplace publisher ID is not `tngo`, update `publisher` in
`package.json` before logging in or publishing.
