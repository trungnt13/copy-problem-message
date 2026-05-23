# Copy Problem Message

Copy the nearest VS Code problem at the cursor with useful file context, or send that same text directly to the active terminal.

## Features

- Copies the nearest diagnostic within a configurable line window.
- Includes severity, source, diagnostic code, workspace-relative location, cursor location, language, and a numbered code excerpt.
- Sends the copied text to the active terminal for workflows that use an interactive CLI or REPL.

## Commands

| Command | Description |
| --- | --- |
| `Copy Problem Message: Copy With Context` | Copies the selected problem context to the clipboard. |
| `Copy Problem Message: Copy With Context and Run in Terminal` | Copies the same context, then submits it to the active terminal. |

## Configuration

| Setting | Default | Description |
| --- | ---: | --- |
| `copyProblemMessage.contextLines` | `3` | Number of lines before and after the diagnostic to include, and the maximum line distance from the cursor when finding a problem. |

## Development

```sh
npm install
npm run compile
npm test
```

Use the `Run Extension` launch configuration to start an Extension Development Host.
