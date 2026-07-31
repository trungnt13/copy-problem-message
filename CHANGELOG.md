# Changelog

## 0.0.6

- Default copied problem excerpts to include three extra lines before and after the diagnostic.
- Document `copyProblemMessage.contextLines` as the configurable extra-line window.
- Keep diagnostic lookup configurable with `copyProblemMessage.searchLines`, defaulting to the cursor line only.

## 0.0.5

- Default copied problem excerpts to the diagnostic line only.

## 0.0.4

- Use the current line as copy-and-run terminal context when no text is selected.
- Keep empty current lines from being sent to the terminal.

## 0.0.3

- Use absolute file paths in copied problem locations when VS Code provides a filesystem path, including user-data documents.
- Use active selected text as copy-and-run context, including selected text fallback when no problem is nearby.
- Ask for confirmation before copying or running selected text over 5000 characters.
- Normalize selected text line endings before copying or running.
- Wrap context and selected text in Markdown code blocks with the document language.
- Report diagnostic source in the problem header and leave language to the code block.

## 0.0.2

- Rename the Marketplace package to `copy-problem-context-agent`.
- Align extension docs and commands around copying compact problem context for agents.
- Add a configurable suffix message for the copy-and-run terminal workflow.
- Document the package identity, suffix behavior, and Marketplace web upload path.

## 0.0.1

- Initial release.
- Copy the nearest VS Code problem with compact surrounding code context.
- Copy and send the same problem context to the active terminal.
