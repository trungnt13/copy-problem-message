---
name: ext-publish
description: Use this skill when preparing, packaging, uploading, or publishing this VS Code extension to the Visual Studio Marketplace. Enforces manifest readiness, creates a local VSIX package, validates package contents, and prints step-by-step Marketplace upload instructions.
---

# VS Code Extension Publishing

Use this workflow for any request to prepare, package, upload, publish, or explain publishing for this extension.

## Rules

- DO NOT publish, upload, create tags, bump versions, or change Marketplace identity unless the user explicitly asks for that action.
- For "prepare", "package", or "ready for publish" requests, create the local VSIX package by default after checks pass.
- Always print step-by-step Marketplace web upload instructions after creating a VSIX package.
- Prefer read-only inspection first: `git status --short --branch`, `package.json`, README, icon, and publish metadata.
- Use official VS Code docs for requirements that may change:
  - Publishing: `https://code.visualstudio.com/api/working-with-extensions/publishing-extension`
  - Manifest: `https://code.visualstudio.com/api/references/extension-manifest`
- Never ask the user to paste a Personal Access Token in chat. If using CLI publish, tell them to create it locally and run `vsce login <publisher>`.
- For users who do not want a Personal Access Token, recommend web upload of the generated VSIX through the Marketplace publisher management page.
- Preserve unrelated worktree changes. Do not revert user edits.

## Required Preflight

Inspect the manifest before packaging:

```sh
node -e "const p=require('./package.json'); console.log(JSON.stringify({name:p.name,displayName:p.displayName,publisher:p.publisher,private:p.private,version:p.version,main:p.main,icon:p.icon,categories:p.categories,repository:p.repository,license:p.license}, null, 2))"
git status --short --branch
```

Block or warn before publish when any of these are true:

- `publisher` is missing, placeholder-like, or `local`.
- `private` is `true`.
- `name` is likely not unique in the Marketplace.
- `main` does not point to an emitted JS file after compile.
- `README.md` is missing or still draft-quality.
- `icon` is missing, SVG, or smaller than `128x128`.
- `repository` or `license` metadata is missing.
- No `.vscodeignore` exists and packaging would include unnecessary files.
- The worktree has uncommitted changes that the user has not approved for packaging.

## Recommended Manifest Shape

For this repo, prefer:

```json
{
  "publisher": "<real-publisher-id>",
  "private": false,
  "repository": {
    "type": "git",
    "url": "https://github.com/trungnt13/copy-problem-message.git"
  },
  "license": "MIT",
  "icon": "images/icon.png"
}
```

If the Marketplace rejects `copy-problem-message` because the name is not unique, choose a new extension `name` before first publish. The published extension ID is `<publisher>.<name>`.

## Packaging Validation

Run compile/tests first:

```sh
npm ci
npm test
```

Create the local VSIX package. Prefer the repo script when present:

```sh
npm run package:vsix
```

Otherwise use `vsce` directly without requiring a global install:

```sh
npm exec --package @vscode/vsce -- vsce package
```

Inspect package contents before publishing:

```sh
npm run package:list
```

If no `package:list` script exists, use:

```sh
npm exec --package @vscode/vsce -- vsce ls
```

Report:

- The generated `.vsix` path.
- The package size when available.
- The extension ID from `package.json`: `<publisher>.<name>`.
- Whether the package list contains only expected runtime files and Marketplace docs.

Optionally install the generated VSIX locally and verify the commands in VS Code when the user asks for local install testing:

```sh
code --install-extension ./<extension-name>-<version>.vsix --force
```

Expected commands:

- `Copy Problem Message: Copy With Context`
- `Copy Problem Message: Copy With Context and Run in Terminal`

## Web Upload Steps

After creating a VSIX, print these steps with the actual publisher, extension ID, version, and VSIX filename filled in:

1. Open `https://marketplace.visualstudio.com/manage`.
2. Sign in with the Microsoft account that owns or can manage the Marketplace publisher.
3. Select or create the publisher matching `package.json` `publisher`.
4. Choose the action to add or update an extension.
5. Upload the generated VSIX file from the repo root.
6. Review the extension ID, version, README, icon, license, and repository links in the Marketplace form.
7. Submit the extension and wait for Marketplace validation/scanning to complete.
8. After it appears, verify the public Marketplace page and install it from VS Code.

Make clear that web upload does not require a PAT, but still requires Microsoft sign-in and publisher permissions.

## Publisher Setup

CLI publishing requires:

- A Visual Studio Marketplace publisher created at `https://marketplace.visualstudio.com/manage`.
- An Azure DevOps Personal Access Token with `Marketplace > Manage` scope.
- Local login with the same publisher ID:

```sh
npm exec --package @vscode/vsce -- vsce login <publisher-id>
```

Do not store the PAT in repo files, shell history snippets, README examples, or agent output.

## Publish

Only publish with `vsce` after the user explicitly confirms CLI publishing:

```sh
npm exec --package @vscode/vsce -- vsce publish
```

Avoid `vsce publish patch`, `minor`, `major`, or an explicit version unless the user wants `vsce` to mutate `package.json` and create the version commit/tag behavior documented by VS Code.

After publish:

```sh
git status --short --branch
npm exec --package @vscode/vsce -- vsce show <publisher-id>.<extension-name>
```

Report the Marketplace URL, version, commit/tag side effects if any, and any manual Marketplace review/scanning status shown by `vsce`.
