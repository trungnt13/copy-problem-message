import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DiagnosticLike,
  PositionLike,
  TextDocumentLike,
  formatProblemContext,
  normalizeContextLines,
  selectNearestDiagnostic
} from "../src/problemContext";

test("normalizes context lines", () => {
  assert.equal(normalizeContextLines(4.8), 4);
  assert.equal(normalizeContextLines(-2), 0);
  assert.equal(normalizeContextLines(Number.NaN), 3);
});

test("selects a diagnostic containing the cursor before a merely nearby diagnostic", () => {
  const cursor = position(10, 8);
  const containing = diagnostic("inside", 10, 5, 10, 12);
  const nearby = diagnostic("nearby", 9, 0, 9, 1);

  const selected = selectNearestDiagnostic([nearby, containing], cursor, 3);

  assert.equal(selected?.diagnostic.message, "inside");
  assert.equal(selected?.distance, 0);
});

test("selects the nearest diagnostic within the configured line window", () => {
  const cursor = position(10, 3);
  const farther = diagnostic("farther", 7, 0, 7, 5);
  const nearer = diagnostic("nearer", 12, 2, 12, 4);

  const selected = selectNearestDiagnostic([farther, nearer], cursor, 3);

  assert.equal(selected?.diagnostic.message, "nearer");
});

test("ignores diagnostics outside the configured line window", () => {
  const selected = selectNearestDiagnostic(
    [diagnostic("outside", 7, 0, 7, 4)],
    position(10, 0),
    2
  );

  assert.equal(selected, undefined);
});

test("formats diagnostic metadata and clamps code excerpt to document bounds", () => {
  const document = fakeDocument(["const x: string = 1;", "console.log(x);"], "typescript");
  const formatted = formatProblemContext({
    diagnostic: {
      ...diagnostic("Type 'number' is not assignable to type 'string'.", 0, 16, 0, 17),
      severity: 0,
      source: "ts",
      code: 2322
    },
    document,
    cursor: position(0, 18),
    contextLines: 3,
    filePath: "src/example.ts"
  });

  assert.match(formatted, /Problem:\nType 'number' is not assignable to type 'string'\./);
  assert.match(formatted, /Severity: Error/);
  assert.match(formatted, /Location: src\/example\.ts:1:17/);
  assert.match(formatted, /Cursor: src\/example\.ts:1:19/);
  assert.match(formatted, /Source: ts/);
  assert.match(formatted, /Code: 2322/);
  assert.match(formatted, /Language: typescript/);
  assert.match(formatted, /> 1 \| const x: string = 1;/);
  assert.match(formatted, /  2 \| console\.log\(x\);/);
});

function diagnostic(
  message: string,
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number
): DiagnosticLike {
  return {
    message,
    severity: 0,
    range: {
      start: position(startLine, startCharacter),
      end: position(endLine, endCharacter)
    }
  };
}

function position(line: number, character: number): PositionLike {
  return { line, character };
}

function fakeDocument(lines: readonly string[], languageId?: string): TextDocumentLike {
  return {
    lineCount: lines.length,
    languageId,
    lineAt(line: number) {
      return { text: lines[line] };
    }
  };
}
