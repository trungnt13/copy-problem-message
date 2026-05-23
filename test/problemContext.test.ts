import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DiagnosticLike,
  PositionLike,
  TextDocumentLike,
  appendRunSuffixMessage,
  defaultRunSuffixMessage,
  formatProblemContext,
  normalizeContextLines,
  normalizeRunSuffixMessage,
  selectNearestDiagnostic
} from "../src/problemContext";

test("normalizes context lines", () => {
  assert.equal(normalizeContextLines(4.8), 4);
  assert.equal(normalizeContextLines(-2), 0);
  assert.equal(normalizeContextLines(Number.NaN), 3);
});

test("normalizes run suffix messages", () => {
  assert.equal(normalizeRunSuffixMessage(" Fix it. "), "Fix it.");
  assert.equal(normalizeRunSuffixMessage("   "), "");
  assert.equal(normalizeRunSuffixMessage(undefined), defaultRunSuffixMessage);
});

test("appends run suffix messages when present", () => {
  assert.equal(
    appendRunSuffixMessage("Problem text", "Understand the root cause and implement fix."),
    "Problem text\n\nUnderstand the root cause and implement fix."
  );
  assert.equal(appendRunSuffixMessage("Problem text", ""), "Problem text");
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
  const document = fakeDocument([
    "def main():",
    "    print(f\"Hello, World! {i}\")",
    "",
    "if __name__ == \"__main__\":",
    "    print(\"Hello, World!\"",
    ""
  ], "python");
  const formatted = formatProblemContext({
    diagnostic: {
      ...diagnostic("\"(\" was not closed", 4, 9, 4, 29),
      severity: 0,
      source: "Pylance"
    },
    document,
    contextLines: 3,
    filePath: "hello.py"
  });

  assert.equal(formatted, [
    "Error (python - Pylance): `\"(\" was not closed`",
    "Location: hello.py:5:10",
    "",
    "Relevant code:",
    "  2 |     print(f\"Hello, World! {i}\")",
    "  3 | ",
    "  4 | if __name__ == \"__main__\":",
    "> 5 |     print(\"Hello, World!\"",
    "  6 | "
  ].join("\n"));
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
