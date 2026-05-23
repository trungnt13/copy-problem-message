# Changelog

## 0.0.3

- Use absolute file paths in copied problem locations when VS Code provides a filesystem path, including user-data documents.
- Use active selected text as copy-and-run context, including selected text fallback when no problem is nearby.
- Normalize selected text line endings before copying or running.

## 0.0.2

- Rename the Marketplace package to `copy-problem-context-agent`.
- Align extension docs and commands around copying compact problem context for agents.
- Add a configurable suffix message for the copy-and-run terminal workflow.
- Document the package identity, suffix behavior, and Marketplace web upload path.

## 0.0.1

- Initial release.
- Copy the nearest VS Code problem with compact surrounding code context.
- Copy and send the same problem context to the active terminal.
