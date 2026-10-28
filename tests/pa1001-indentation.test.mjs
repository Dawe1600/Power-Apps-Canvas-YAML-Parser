import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateYaml } from '../src/index.mjs';

describe('PA1001: Indentation and Tab Detection (Seam: validateYaml)', () => {
  it('detects tab characters in indentation', () => {
    const yaml = 'MyButton:\n\tControl: Button\n';
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    const diag = result.diagnostics.find(d => d.code === 'PA1001' && /tab/i.test(d.message));
    assert.ok(diag, 'Expected diagnostic for tab indentation');
    assert.equal(diag.line, 2);
    assert.equal(diag.column, 1);
    assert.equal(diag.severity, 'error');
    assert.match(diag.hint, /spacja|spacje|space/i);
  });

  it('detects odd-space indentation (e.g. 1 space, 3 spaces)', () => {
    const yaml = `
MyButton:
 Control: Button
 Properties:
   Text: ="Hello"
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, false);
    const oddDiags = result.diagnostics.filter(d => d.code === 'PA1001' && /nieparzyst|odd|wielokrotno/i.test(d.message));
    assert.ok(oddDiags.length >= 1, 'Expected diagnostic for odd indentation');
    assert.equal(oddDiags[0].line, 3);
    assert.equal(oddDiags[0].column, 2);
    assert.equal(oddDiags[0].severity, 'error');
  });

  it('passes on valid 2-space indentation', () => {
    const yaml = `
App:
  Screens:
    Screen1:
      Control: Screen
      Properties:
        LoadingSpinner: =LoadingSpinner.None
      Children:
        - Button1:
            Control: Button
            Properties:
              Text: ="Click me"
`;
    const result = validateYaml(yaml);

    assert.equal(result.valid, true);
    assert.equal(result.diagnostics.length, 0);
  });
});
