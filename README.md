# Copy Problem Context Agent

Copy compact VS Code problem context for agent prompts, then optionally send it
to the active terminal with a configurable instruction suffix.

## Features

- Copies the nearest diagnostic within a configurable line window.
- Formats the problem as compact text with severity, language/source, location, and nearby code by default.
- Sends the copied text to the active terminal for interactive agent CLI workflows.
- Appends a configurable instruction when copying and running in the terminal.
- Uses selected text, or the current line when no text is selected, as the terminal context.
- Warns for confirmation before copying or running selected text over 5000 characters.
- Runs selected text even when there is no nearby problem, without appending the suffix.
- Keeps terminal execution disabled in untrusted workspaces while still copying to the clipboard.

## Copied Format

`Copy Problem Context Agent: Copy for Agent` copies compact problem context:

````text
Error (source: Pylance): `"(" was not closed`
Location: /Users/example/project/hello.py:5:10

Relevant code:
```python
  2 |     print(f"Hello, World! {i}")
  3 |
  4 | if __name__ == "__main__":
> 5 |     print("Hello, World!"
  6 |
```
````

`Copy Problem Context Agent: Copy and Run in Terminal` copies and sends the same
context, then appends the configured suffix as a separate paragraph:

```text
Understand the root cause and implement fix.
```

When text is selected, `Copy and Run in Terminal` uses that selection instead
of the automatic code excerpt. If the selection is longer than 5000 characters,
the command asks for confirmation before copying or sending it to the terminal.
If no nearby problem exists, it sends only the absolute location and selected
text, without the suffix:

````text
Location: /Users/example/project/hello.py:5:5

Selected text:
```python
print("Hello, World!"
```
````

When no text is selected, `Copy and Run in Terminal` uses the current line as
the terminal context. Empty current lines are not sent to the terminal.

## Commands

| Command | Description |
| --- | --- |
| `Copy Problem Context Agent: Copy for Agent` | Copies the selected problem context to the clipboard. |
| `Copy Problem Context Agent: Copy and Run in Terminal` | Copies the same context, then submits it to the active terminal. |

## Configuration

| Setting | Default | Description |
| --- | ---: | --- |
| `copyProblemMessage.contextLines` | `3` | Number of extra lines before and after the diagnostic to include. |
| `copyProblemMessage.searchLines` | `0` | Maximum line distance from the cursor when finding a diagnostic. The default searches only the cursor line. If unset, an explicit `copyProblemMessage.contextLines` value is reused for lookup compatibility. |
| `copyProblemMessage.runSuffixMessage` | `Understand the root cause and implement fix.` | Message appended as `\n\n{message}` before sending text to the terminal. Set to an empty string to disable the suffix. |

## Package

- Publisher: `tngo`
- Package name: `copy-problem-context-agent`
- Extension ID: `tngo.copy-problem-context-agent`
- Repository: https://github.com/trungnt13/copy-problem-message

## Development

```sh
npm ci
npm test
npm run package:vsix
```

Use the `Run Extension` launch configuration to start an Extension Development Host.

## Publishing

Build the VSIX with `npm run package:vsix`, then upload the generated
`copy-problem-context-agent-0.0.6.vsix` from the Visual Studio Marketplace
publisher page.
