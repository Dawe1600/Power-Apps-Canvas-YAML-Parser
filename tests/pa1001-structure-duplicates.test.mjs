import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateYaml } from '../src/index.mjs';

describe('PA1001: Duplicate Keys and Empty Blocks (Seam: validateYaml)', () => {
  it('detects duplicate keys in Properties block', () => {
    const yaml = `
MyButton:
  Control: Button
  Properties:
    Text: ="First"
    Text: ="Second"
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    const diag = result.diagnostics.find(d => d.code === 'PA1001' && /zduplik|duplikat|duplicate/i.test(d.message));
    assert.ok(diag, 'Expected diagnostic for duplicate key');
    assert.equal(diag.line, 6);
    assert.equal(diag.severity, 'error');
    assert.match(diag.message, /Text/);
    assert.match(diag.hint, /unikaln|usuń|zmień/i);
  });

  it('detects duplicate screen keys in Screens block', () => {
    const yaml = `
Screens:
  Screen1:
    Control: Screen
  Screen1:
    Control: Screen
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    const diag = result.diagnostics.find(d => d.code === 'PA1001' && /zduplik|duplikat|duplicate/i.test(d.message));
    assert.ok(diag, 'Expected diagnostic for duplicate screen key');
    assert.equal(diag.line, 5);
    assert.match(diag.message, /Screen1/);
  });

  it('detects empty Properties: {} and Children: []', () => {
    const yaml = `
MyButton:
  Control: Button
  Properties: {}
  Children: []
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    const propsDiag = result.diagnostics.find(d => d.code === 'PA1001' && /Properties.*pust/i.test(d.message));
    const childrenDiag = result.diagnostics.find(d => d.code === 'PA1001' && /Children.*pust/i.test(d.message));

    assert.ok(propsDiag, 'Expected diagnostic for empty Properties: {}');
    assert.ok(childrenDiag, 'Expected diagnostic for empty Children: []');
    assert.equal(propsDiag.line, 4);
    assert.equal(childrenDiag.line, 5);
  });

  it('detects null/empty body for Properties: and Children:', () => {
    const yaml = `
MyButton:
  Control: Button
  Properties:
  Children:
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    const propsDiag = result.diagnostics.find(d => d.code === 'PA1001' && /Properties.*(?:pust|null)/i.test(d.message));
    const childrenDiag = result.diagnostics.find(d => d.code === 'PA1001' && /Children.*(?:pust|null)/i.test(d.message));

    assert.ok(propsDiag, 'Expected diagnostic for null/empty Properties');
    assert.ok(childrenDiag, 'Expected diagnostic for null/empty Children');
  });

  it('passes on valid non-empty Properties and unique keys', () => {
    const yaml = `
MyButton:
  Control: Button
  Properties:
    Text: ="First"
    Width: =200
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, true);
    assert.equal(result.diagnostics.length, 0);
  });
});
