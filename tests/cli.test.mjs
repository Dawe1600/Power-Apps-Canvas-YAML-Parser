import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CLI_PATH = path.resolve('bin/pa-yaml-validator.mjs');

describe('CLI Seam: bin/pa-yaml-validator.mjs', () => {
  let tmpDir;
  let validFile;
  let invalidFile;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-yaml-cli-test-'));
    validFile = path.join(tmpDir, 'valid.pa.yaml');
    invalidFile = path.join(tmpDir, 'invalid.pa.yaml');

    fs.writeFileSync(
      validFile,
      `MyButton:
  Control: Button
  Properties:
    Text: |-
      ="Placówka: " & ThisItem.Title
`
    );

    fs.writeFileSync(
      invalidFile,
      `MyButton:
  Control: Button
  Properties:
    Text: ="Placówka: " & ThisItem.Title
`
    );
  });

  after(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('exits with 0 on valid YAML file and prints clean status', () => {
    const res = spawnSync(process.execPath, [CLI_PATH, validFile], { encoding: 'utf8' });
    assert.equal(res.status, 0);
    assert.match(res.stdout, /0 błędów|0 errors|valid|sukces/i);
  });

  it('exits with 1 on invalid YAML file and prints human-readable diagnostics with hint', () => {
    const res = spawnSync(process.execPath, [CLI_PATH, invalidFile], { encoding: 'utf8' });
    assert.equal(res.status, 1);
    assert.match(res.stdout, /PA1001/);
    assert.match(res.stdout, /Plain Scalar Hazard/i);
    assert.match(res.stdout, /💡 Hint|Hint:/i);
    assert.match(res.stdout, /wiersz 4|line 4|4:21/i);
  });

  it('supports --json flag and outputs structured JSON report', () => {
    const res = spawnSync(process.execPath, [CLI_PATH, invalidFile, '--json'], { encoding: 'utf8' });
    assert.equal(res.status, 1);
    const json = JSON.parse(res.stdout.trim());
    assert.equal(json.valid, false);
    assert.ok(json.results);
    assert.equal(json.results.length, 1);
    const fileResult = json.results[0];
    assert.equal(fileResult.valid, false);
    const diag = fileResult.diagnostics[0];
    assert.equal(diag.code, 'PA1001');
    assert.equal(diag.line, 4);
    assert.ok(diag.hint);
  });

  it('exits with 1 when a non-existent file path is provided', () => {
    const nonExistent = path.join(tmpDir, 'does-not-exist.pa.yaml');
    const res = spawnSync(process.execPath, [CLI_PATH, nonExistent], { encoding: 'utf8' });
    assert.equal(res.status, 1);
    assert.match(res.stdout, /CLI_IO_ERROR/);
  });
});
