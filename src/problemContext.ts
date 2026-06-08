export interface PositionLike {
  readonly line: number;
  readonly character: number;
}

export interface RangeLike {
  readonly start: PositionLike;
  readonly end: PositionLike;
}

export interface DiagnosticLike {
  readonly message: string;
  readonly range: RangeLike;
  readonly severity: number;
  readonly source?: string;
  readonly code?: string | number | { value: string | number };
}

export interface TextLineLike {
  readonly text: string;
}

export interface TextDocumentLike {
  readonly lineCount: number;
  readonly languageId?: string;
  lineAt(line: number): TextLineLike;
}

export interface SelectedDiagnostic<TDiagnostic extends DiagnosticLike = DiagnosticLike> {
  readonly diagnostic: TDiagnostic;
  readonly distance: number;
}

export interface FormatProblemOptions<TDiagnostic extends DiagnosticLike = DiagnosticLike> {
  readonly diagnostic: TDiagnostic;
  readonly document: TextDocumentLike;
  readonly contextLines: number;
  readonly filePath: string;
  readonly selectedText?: string;
}

export interface FormatSelectedContextOptions {
  readonly filePath: string;
  readonly range: RangeLike;
  readonly languageId?: string;
  readonly selectedText: string;
}

export interface FormatCurrentLineContextOptions {
  readonly filePath: string;
  readonly range: RangeLike;
  readonly languageId?: string;
  readonly text: string;
}

export interface UriPathLike {
  readonly fsPath: string;
  toString(skipEncoding?: boolean): string;
}

const defaultContextLines = 3;
export const defaultRunSuffixMessage = "Understand the root cause and implement fix.";

export function normalizeContextLines(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultContextLines;
  }

  return Math.max(0, Math.floor(value));
}

export function normalizeRunSuffixMessage(value: unknown): string {
  if (typeof value !== "string") {
    return defaultRunSuffixMessage;
  }

  return value.trim();
}

export function appendRunSuffixMessage(text: string, message: string): string {
  const normalizedMessage = normalizeRunSuffixMessage(message);
  if (normalizedMessage.length === 0) {
    return text;
  }

  return `${text}\n\n${normalizedMessage}`;
}

export function normalizeSelectedText(value: string): string {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");

  while (lines.length > 0 && lines[0].trim().length === 0) {
    lines.shift();
  }

  while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
    lines.pop();
  }

  return lines.join("\n");
}

export function formatDocumentPath(uri: UriPathLike): string {
  if (isAbsoluteFilePath(uri.fsPath)) {
    return uri.fsPath;
  }

  return uri.toString(true);
}

export function selectNearestDiagnostic<TDiagnostic extends DiagnosticLike>(
  diagnostics: readonly TDiagnostic[],
  cursor: PositionLike,
  contextLines: number
): SelectedDiagnostic<TDiagnostic> | undefined {
  const normalizedContextLines = normalizeContextLines(contextLines);
  const candidates = diagnostics
    .filter((diagnostic) => isDiagnosticWithinLineWindow(diagnostic, cursor.line, normalizedContextLines))
    .map((diagnostic) => ({
      diagnostic,
      containsCursor: rangeContainsPosition(diagnostic.range, cursor),
      distance: diagnosticDistance(diagnostic, cursor)
    }))
    .sort((left, right) => {
      if (left.containsCursor !== right.containsCursor) {
        return left.containsCursor ? -1 : 1;
      }

      if (left.distance !== right.distance) {
        return left.distance - right.distance;
      }

      return comparePosition(left.diagnostic.range.start, right.diagnostic.range.start);
    });

  const best = candidates[0];
  if (!best) {
    return undefined;
  }

  return {
    diagnostic: best.diagnostic,
    distance: best.distance
  };
}

export function formatProblemContext(options: FormatProblemOptions): string {
  const contextLines = normalizeContextLines(options.contextLines);
  const diagnostic = options.diagnostic;
  const range = diagnostic.range;
  const startLine = Math.max(0, range.start.line - contextLines);
  const endLine = Math.min(options.document.lineCount - 1, range.end.line + contextLines);
  const location = `${options.filePath}:${range.start.line + 1}:${range.start.character + 1}`;
  const excerpt = options.selectedText === undefined
    ? formatCodeExcerpt(options.document, startLine, endLine, range)
    : normalizeSelectedText(options.selectedText);

  return [
    formatProblemHeader(diagnostic),
    `Location: ${location}`,
    "",
    "Relevant code:",
    formatMarkdownCodeBlock(excerpt, options.document.languageId)
  ].join("\n");
}

export function formatSelectedContext(options: FormatSelectedContextOptions): string {
  return formatTextContext({
    filePath: options.filePath,
    range: options.range,
    languageId: options.languageId,
    label: "Selected text:",
    text: options.selectedText
  });
}

export function formatCurrentLineContext(options: FormatCurrentLineContextOptions): string {
  return formatTextContext({
    filePath: options.filePath,
    range: options.range,
    languageId: options.languageId,
    label: "Current line:",
    text: options.text
  });
}

export function severityLabel(severity: number): string {
  switch (severity) {
    case 0:
      return "Error";
    case 1:
      return "Warning";
    case 2:
      return "Information";
    case 3:
      return "Hint";
    default:
      return "Unknown";
  }
}

function formatProblemHeader(diagnostic: DiagnosticLike): string {
  const sourceContext = diagnostic.source ? ` (source: ${diagnostic.source})` : "";

  return `${severityLabel(diagnostic.severity)}${sourceContext}: ${formatInlineProblemMessage(diagnostic.message)}`;
}

function isDiagnosticWithinLineWindow(
  diagnostic: DiagnosticLike,
  cursorLine: number,
  contextLines: number
): boolean {
  return cursorLine >= diagnostic.range.start.line - contextLines
    && cursorLine <= diagnostic.range.end.line + contextLines;
}

function diagnosticDistance(diagnostic: DiagnosticLike, cursor: PositionLike): number {
  if (rangeContainsPosition(diagnostic.range, cursor)) {
    return 0;
  }

  if (cursor.line < diagnostic.range.start.line) {
    return positionDistance(cursor, diagnostic.range.start);
  }

  if (cursor.line > diagnostic.range.end.line) {
    return positionDistance(cursor, diagnostic.range.end);
  }

  const startDistance = Math.abs(cursor.character - diagnostic.range.start.character);
  const endDistance = Math.abs(cursor.character - diagnostic.range.end.character);
  return Math.min(startDistance, endDistance);
}

function positionDistance(left: PositionLike, right: PositionLike): number {
  const lineDistance = Math.abs(left.line - right.line);
  const characterDistance = Math.abs(left.character - right.character);

  return lineDistance * 100_000 + characterDistance;
}

function rangeContainsPosition(range: RangeLike, position: PositionLike): boolean {
  return comparePosition(position, range.start) >= 0 && comparePosition(position, range.end) <= 0;
}

function comparePosition(left: PositionLike, right: PositionLike): number {
  if (left.line !== right.line) {
    return left.line - right.line;
  }

  return left.character - right.character;
}

function formatInlineProblemMessage(message: string): string {
  const normalizedMessage = message.trim().replace(/\s+/g, " ");
  if (normalizedMessage.length === 0) {
    return "``";
  }

  if (normalizedMessage.includes("`")) {
    return normalizedMessage;
  }

  return `\`${normalizedMessage}\``;
}

function formatTextContext(options: {
  readonly filePath: string;
  readonly range: RangeLike;
  readonly languageId?: string;
  readonly label: string;
  readonly text: string;
}): string {
  const location = `${options.filePath}:${options.range.start.line + 1}:${options.range.start.character + 1}`;

  return [
    `Location: ${location}`,
    "",
    options.label,
    formatMarkdownCodeBlock(normalizeSelectedText(options.text), options.languageId)
  ].join("\n");
}

function formatMarkdownCodeBlock(text: string, languageId?: string): string {
  const language = formatMarkdownLanguage(languageId);
  return [`\`\`\`${language}`, text, "```"].join("\n");
}

function formatMarkdownLanguage(languageId?: string): string {
  if (!languageId) {
    return "";
  }

  return /^[A-Za-z0-9_-]+$/.test(languageId) ? languageId : "";
}

function isAbsoluteFilePath(path: string): boolean {
  return path.startsWith("/")
    || /^[A-Za-z]:[\\/]/.test(path)
    || path.startsWith("\\\\");
}

function formatCodeExcerpt(
  document: TextDocumentLike,
  startLine: number,
  endLine: number,
  diagnosticRange: RangeLike
): string {
  const lineNumberWidth = String(endLine + 1).length;
  const lines: string[] = [];

  for (let line = startLine; line <= endLine; line += 1) {
    const marker = line >= diagnosticRange.start.line && line <= diagnosticRange.end.line ? ">" : " ";
    const lineNumber = String(line + 1).padStart(lineNumberWidth, " ");
    lines.push(`${marker} ${lineNumber} | ${document.lineAt(line).text}`);
  }

  return lines.join("\n");
}
