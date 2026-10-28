import { validateYamlSyntax } from './rules/yaml-syntax.mjs';

/**
 * Validates a Power Apps Canvas YAML document or snippet.
 * Pure, deterministic, synchronous function.
 *
 * @param {string} yamlText
 * @param {object} [options]
 * @param {'auto'|'pa-module'|'control-snippet'|'fx'} [options.mode='auto']
 * @returns {object} Validation result { valid, mode, diagnostics, metadata }
 */
export function validateYaml(yamlText, options = {}) {
  if (typeof yamlText !== 'string') {
    throw new TypeError('validateYaml expects content to be a string');
  }

  // Determine mode
  let mode = options.mode ?? 'auto';
  if (mode === 'auto') {
    if (/(?:^|\n)\s*(?:Screens|App|ComponentDefinitions|DataSources)\s*:/m.test(yamlText)) {
      mode = 'pa-module';
    } else {
      mode = 'control-snippet';
    }
  }

  // Run Layer 1 YAML syntax validation
  const diagnostics = validateYamlSyntax(yamlText, options);

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;

  return {
    valid: errorCount === 0,
    mode,
    diagnostics,
    metadata: {
      controlNames: [],
      screenNames: [],
      referencedCollections: [],
      initializedCollections: []
    }
  };
}

/**
 * Validates a standalone Power Fx formula script (.fx).
 * Placeholder for Layer 4.
 */
export function validateFx(fxText, options = {}) {
  return {
    valid: true,
    mode: 'fx',
    diagnostics: [],
    metadata: {
      controlNames: [],
      screenNames: [],
      referencedCollections: [],
      initializedCollections: []
    }
  };
}

/**
 * Validates an entire project directory.
 * Placeholder for Layer 6.
 */
export function validateProject(projectDir, options = {}) {
  return {
    valid: true,
    filesChecked: 0,
    diagnostics: [],
    summary: { errors: 0, warnings: 0 }
  };
}
