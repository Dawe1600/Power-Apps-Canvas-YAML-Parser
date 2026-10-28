import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateYaml } from '../src/index.mjs';

describe('PA1001: Plain Scalar Hazard (Seam: validateYaml)', () => {
  it('detects inline formula containing colon followed by space (": ")', () => {
    const yaml = `
MyButton:
  Control: Button
  Properties:
    Text: ="Placówka: " & ThisItem.Title
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    assert.equal(result.diagnostics.length, 1);
    const diag = result.diagnostics[0];
    assert.equal(diag.code, 'PA1001');
    assert.equal(diag.severity, 'error');
    assert.equal(diag.line, 5);
    assert.equal(diag.column, 21);
    assert.match(diag.message, /Plain Scalar Hazard/i);
    assert.match(diag.hint, /\|-/);
    assert.equal(diag.lineText, '    Text: ="Placówka: " & ThisItem.Title');
  });

  it('detects inline formula containing curly braces ("{" or "}")', () => {
    const yaml = `
MyButton:
  Control: Button
  Properties:
    OnSelect: =UpdateContext({ locVisible: true })
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    assert.equal(result.diagnostics.length, 1);
    const diag = result.diagnostics[0];
    assert.equal(diag.code, 'PA1001');
    assert.equal(diag.severity, 'error');
    assert.equal(diag.line, 5);
    assert.equal(diag.column, 30);
    assert.match(diag.message, /Plain Scalar Hazard/i);
    assert.match(diag.hint, /\|-/);
  });

  it('passes when formulas with colons and curly braces are inside a "|-" or "|" Block Scalar', () => {
    const yaml = `
MyButton:
  Control: Button
  Properties:
    Text: |-
      ="Placówka: " & ThisItem.Title
    OnSelect: |-
      =UpdateContext({ locVisible: true })
    Tooltip: |
      ="Status: " & If(true, "OK", "Błąd")
    Description: |2-
      ="Info: " & User().FullName
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, true);
    assert.equal(result.diagnostics.length, 0);
  });
});
