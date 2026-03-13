import type { CallScript, Reflection } from '../types';

const EXPORT_VERSION = 1;

export interface ImportPreview {
  scripts: CallScript[];
  reflections: Reflection[];
  newScripts: number;
  newReflections: number;
}

export function exportToJSON(scripts: CallScript[], reflections: Reflection[]): string {
  return JSON.stringify(
    {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      scripts,
      reflections,
    },
    null,
    2
  );
}

export function exportScriptsToCSV(scripts: CallScript[]): string {
  const headers = [
    'id',
    'description',
    'tone',
    'timestamp',
    'opening',
    'mainAsk',
    'close',
    'branchX_condition',
    'branchX_response',
    'branchY_condition',
    'branchY_response',
  ];

  const escape = (value: string | number | undefined | null) => {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const rows = scripts.map((script) =>
    [
      script.id,
      script.description,
      script.tone,
      script.timestamp,
      script.opening,
      script.mainAsk,
      script.close,
      script.branchX?.condition,
      script.branchX?.response,
      script.branchY?.condition,
      script.branchY?.response,
    ]
      .map(escape)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\r\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function isCallScript(value: unknown): value is CallScript {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.description === 'string' &&
    typeof value.tone === 'string' &&
    typeof value.opening === 'string' &&
    typeof value.mainAsk === 'string' &&
    typeof value.close === 'string' &&
    typeof value.timestamp === 'number' &&
    isRecord(value.branchX) &&
    typeof value.branchX.condition === 'string' &&
    typeof value.branchX.response === 'string' &&
    isRecord(value.branchY) &&
    typeof value.branchY.condition === 'string' &&
    typeof value.branchY.response === 'string'
  );
}

function isReflection(value: unknown): value is Reflection {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.scriptId === 'string' &&
    typeof value.feedback === 'string' &&
    typeof value.timestamp === 'number'
  );
}

export function parseImportJSON(text: string): ImportPreview | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: 'File is not valid JSON.' };
  }

  if (!isRecord(parsed)) {
    return { error: 'File does not contain a valid backup object.' };
  }

  const scripts = Array.isArray(parsed.scripts) ? parsed.scripts.filter(isCallScript) : [];
  const reflections = Array.isArray(parsed.reflections)
    ? parsed.reflections.filter(isReflection)
    : [];

  return {
    scripts,
    reflections,
    newScripts: scripts.length,
    newReflections: reflections.length,
  };
}

export function applyImport(
  preview: ImportPreview,
  existing: CallScript[] | { scripts: CallScript[]; reflections: Reflection[] },
  mode: 'merge' | 'replace'
): { scripts: CallScript[]; reflections: Reflection[] } {
  const existingScripts = Array.isArray(existing) ? existing : existing.scripts;
  const existingReflections = Array.isArray(existing) ? [] : existing.reflections;

  if (mode === 'replace') {
    return {
      scripts: preview.scripts,
      reflections: preview.reflections,
    };
  }

  const existingScriptIds = new Set(existingScripts.map((script) => script.id));
  const existingReflectionIds = new Set(existingReflections.map((reflection) => reflection.id));

  return {
    scripts: [...existingScripts, ...preview.scripts.filter((script) => !existingScriptIds.has(script.id))],
    reflections: [
      ...existingReflections,
      ...preview.reflections.filter((reflection) => !existingReflectionIds.has(reflection.id)),
    ],
  };
}
