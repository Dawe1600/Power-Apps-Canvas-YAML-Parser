import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateYaml } from '../src/index.mjs';

describe('PA1001: Special Indicators and Parse Errors (Seam: validateYaml)', () => {
  it('detects unquoted @ at start of non-formula scalar', () => {
    const yaml = `
MyButton:
  Control: @Button
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    const diag = result.diagnostics.find(d => d.code === 'PA1001');
    assert.ok(diag, 'Expected diagnostic for unquoted @');
    assert.equal(diag.line, 3);
    assert.equal(diag.severity, 'error');
    assert.match(diag.hint, /cudzysłów|quote|znaki specjalne/i);
  });

  it('detects unquoted * / & / ! / % at start of non-formula scalar', () => {
    const yaml = `
MyButton:
  Control: *Button
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    const diag = result.diagnostics.find(d => d.code === 'PA1001');
    assert.ok(diag, 'Expected diagnostic for unquoted *');
    assert.equal(diag.line, 3);
    assert.equal(diag.severity, 'error');
  });

  it('detects unquoted special indicator in sequence item (e.g. - @Button)', () => {
    const yaml = `
Children:
  - @Button
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    const diag = result.diagnostics.find(d => d.code === 'PA1001');
    assert.ok(diag, 'Expected diagnostic for sequence unquoted @');
    assert.equal(diag.line, 3);
    assert.equal(diag.severity, 'error');
  });

  it('detects generic YAML syntax errors and provides line, column and hint', () => {
    const yaml = `
MyButton:
  Control: Button
  Properties: [invalid syntax
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    const diag = result.diagnostics.find(d => d.code === 'PA1001');
    assert.ok(diag, 'Expected syntax error diagnostic');
    assert.equal(diag.severity, 'error');
    assert.ok(diag.line >= 4);
    assert.ok(diag.column >= 1);
    assert.ok(diag.hint);
  });
});
