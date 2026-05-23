import * as vscode from "vscode";
import {
  appendRunSuffixMessage,
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

  if (!selectedText.text) {
    const text = await buildProblemContextText();
    return text ? { text, appendSuffix: true } : undefined;
  }

  const contextLines = getConfiguredContextLines();
  const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
  const selection = selectNearestDiagnostic(diagnostics, editor.selection.active, contextLines);
  const filePath = getDocumentPath(editor.document.uri);

  if (!selection) {
    return {
      text: formatSelectedContext({
        filePath,
        range: editor.selection,
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
    return { canceled: false };
  }

  const selectedCharacterCount = getSelectionCharacterCount(editor.document, editor.selection);
  if (selectedCharacterCount > maxSelectedTextCharacters) {
    const message = `The selected text is ${selectedCharacterCount} characters. `
      + "Copy and Run can flood the terminal with large selections.";
    const choice = await vscode.window.showWarningMessage(
      message,
      { modal: true },
      confirmLargeSelectionAction
    );

    if (choice !== confirmLargeSelectionAction) {
      return { canceled: true };
    }
  }

  const selectedText = normalizeSelectedText(editor.document.getText(editor.selection));
  return {
    text: selectedText.length > 0 ? selectedText : undefined,
    canceled: false
  };
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
