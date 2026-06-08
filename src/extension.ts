import * as vscode from "vscode";
import {
  appendRunSuffixMessage,
  formatCurrentLineContext,
  formatDocumentPath,
  formatProblemContext,
  formatSelectedContext,
  normalizeContextLines,
  normalizeRunSuffixMessage,
  normalizeSelectedText,
  selectNearestDiagnostic
} from "./problemContext";

const contextLinesSetting = "contextLines";
const runSuffixMessageSetting = "runSuffixMessage";
const maxSelectedTextCharacters = 5_000;
const confirmLargeSelectionAction = "Continue";

interface RunContextText {
  readonly text: string;
  readonly appendSuffix: boolean;
}

interface SelectedText {
  readonly text?: string;
  readonly range?: vscode.Range;
  readonly source?: "selection" | "currentLine";
  readonly canceled: boolean;
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("copyProblemMessage.copy", copyProblemMessage),
    vscode.commands.registerCommand("copyProblemMessage.copyAndRun", copyProblemMessageAndRun)
  );
}

export function deactivate(): void {
  // No extension resources need disposal beyond command subscriptions.
}

async function copyProblemMessage(): Promise<void> {
  const text = await buildProblemContextText();
  if (!text) {
    return;
  }

  await vscode.env.clipboard.writeText(text);
  vscode.window.showInformationMessage("Copied problem message with context.");
}

async function copyProblemMessageAndRun(): Promise<void> {
  const context = await buildRunContextText();
  if (!context) {
    return;
  }

  const text = context.appendSuffix
    ? appendRunSuffixMessage(context.text, getConfiguredRunSuffixMessage())
    : context.text;
  await vscode.env.clipboard.writeText(text);

  if (!vscode.workspace.isTrusted) {
    vscode.window.showWarningMessage(
      "Copied problem message, but running it in a terminal requires a trusted workspace."
    );
    return;
  }

  const terminal = vscode.window.activeTerminal;
  if (!terminal) {
    vscode.window.showWarningMessage("Copied problem message, but no active terminal is available.");
    return;
  }

  terminal.sendText(text, true);
  terminal.show();
}

async function buildProblemContextText(): Promise<string | undefined> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("Open a file and place the cursor near a problem first.");
    return undefined;
  }

  const contextLines = getConfiguredContextLines();
  const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
  const selection = selectNearestDiagnostic(diagnostics, editor.selection.active, contextLines);

  if (!selection) {
    vscode.window.showWarningMessage(
      `No problem found within ${contextLines} line${contextLines === 1 ? "" : "s"} of the cursor.`
    );
    return undefined;
  }

  return formatProblemContext({
    diagnostic: selection.diagnostic,
    document: editor.document,
    contextLines,
    filePath: getDocumentPath(editor.document.uri)
  });
}

async function buildRunContextText(): Promise<RunContextText | undefined> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("Open a file and place the cursor near a problem first.");
    return undefined;
  }

  const selectedText = await getSelectedText(editor);
  if (selectedText.canceled) {
    return undefined;
  }

  if (!selectedText.text || !selectedText.range) {
    const text = await buildProblemContextText();
    return text ? { text, appendSuffix: true } : undefined;
  }

  const contextLines = getConfiguredContextLines();
  const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
  const selection = selectNearestDiagnostic(diagnostics, editor.selection.active, contextLines);
  const filePath = getDocumentPath(editor.document.uri);

  if (!selection) {
    if (selectedText.source === "currentLine") {
      return {
        text: formatCurrentLineContext({
          filePath,
          range: selectedText.range,
          languageId: editor.document.languageId,
          text: selectedText.text
        }),
        appendSuffix: false
      };
    }

    return {
      text: formatSelectedContext({
        filePath,
        range: selectedText.range,
        languageId: editor.document.languageId,
        selectedText: selectedText.text
      }),
      appendSuffix: false
    };
  }

  return {
    text: formatProblemContext({
      diagnostic: selection.diagnostic,
      document: editor.document,
      contextLines,
      filePath,
      selectedText: selectedText.text
    }),
    appendSuffix: true
  };
}

function getConfiguredContextLines(): number {
  return normalizeContextLines(
    vscode.workspace.getConfiguration("copyProblemMessage").get(contextLinesSetting)
  );
}

function getConfiguredRunSuffixMessage(): string {
  return normalizeRunSuffixMessage(
    vscode.workspace.getConfiguration("copyProblemMessage").get(runSuffixMessageSetting)
  );
}

async function getSelectedText(editor: vscode.TextEditor): Promise<SelectedText> {
  if (editor.selection.isEmpty) {
    return getCurrentLineText(editor);
  }

  const selectedCharacterCount = getSelectionCharacterCount(editor.document, editor.selection);
  if (!await confirmLargeRunText("selected text", selectedCharacterCount)) {
    return { canceled: true };
  }

  const selectedText = normalizeSelectedText(editor.document.getText(editor.selection));
  return {
    text: selectedText.length > 0 ? selectedText : undefined,
    range: editor.selection,
    source: "selection",
    canceled: false
  };
}

async function getCurrentLineText(editor: vscode.TextEditor): Promise<SelectedText> {
  const lineNumber = editor.selection.active.line;
  if (lineNumber < 0 || lineNumber >= editor.document.lineCount) {
    vscode.window.showWarningMessage("Place the cursor on a valid line before using Copy and Run in Terminal.");
    return { canceled: true };
  }

  const line = editor.document.lineAt(lineNumber);
  const text = normalizeSelectedText(line.text);
  if (text.length === 0) {
    vscode.window.showWarningMessage("Current line is empty. Select text or move the cursor to a non-empty line first.");
    return { canceled: true };
  }

  if (!await confirmLargeRunText("current line", line.text.length)) {
    return { canceled: true };
  }

  return {
    text,
    range: line.range,
    source: "currentLine",
    canceled: false
  };
}

async function confirmLargeRunText(label: string, characterCount: number): Promise<boolean> {
  if (characterCount <= maxSelectedTextCharacters) {
    return true;
  }

  const message = `The ${label} is ${characterCount} characters. `
    + "Copy and Run can flood the terminal with large input.";
  const choice = await vscode.window.showWarningMessage(
    message,
    { modal: true },
    confirmLargeSelectionAction
  );

  return choice === confirmLargeSelectionAction;
}

function getSelectionCharacterCount(
  document: vscode.TextDocument,
  selection: vscode.Selection
): number {
  return document.offsetAt(selection.end) - document.offsetAt(selection.start);
}

function getDocumentPath(uri: vscode.Uri): string {
  return formatDocumentPath(uri);
}
