# Copy Problem Message

Copy problem with context for Agent.

## Features

- Copies the nearest diagnostic within a configurable line window.
- Formats the problem as compact text with severity, language/source, location, and nearby code.
- Sends the copied text to the active terminal for interactive agent CLI workflows.
- Keeps terminal execution disabled in untrusted workspaces while still copying to the clipboard.

Example output:

```text
Error (python - Pylance): `"(" was not closed`
Location: hello.py:5:10

Relevant code:
  2 |     print(f"Hello, World! {i}")
  3 |
  4 | if __name__ == "__main__":
> 5 |     print("Hello, World!"
  6 |
```

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
npm ci
npm test
npm run package:vsix
```

Use the `Run Extension` launch configuration to start an Extension Development Host.

## Publishing

Publishing requires a Visual Studio Marketplace publisher that matches `publisher` in `package.json`.
Create the publisher and run `npm exec -- vsce login <publisher-id>` locally before publishing.
