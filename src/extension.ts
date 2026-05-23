import * as vscode from "vscode";
import {
  formatProblemContext,
  normalizeContextLines,
  selectNearestDiagnostic
} from "./problemContext";

const contextLinesSetting = "contextLines";

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
  const text = await buildProblemContextText();
  if (!text) {
    return;
  }

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
    filePath: getWorkspaceRelativePath(editor.document.uri)
  });
}

function getConfiguredContextLines(): number {
  return normalizeContextLines(
    vscode.workspace.getConfiguration("copyProblemMessage").get(contextLinesSetting)
  );
}

function getWorkspaceRelativePath(uri: vscode.Uri): string {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    return uri.scheme === "file" ? uri.fsPath : uri.toString(true);
  }

  return vscode.workspace.asRelativePath(uri, false);
}
