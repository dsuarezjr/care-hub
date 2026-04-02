import type { CareDataBundle } from '../../domain/models/care';

function toCsvRow(values: Array<string | number>): string {
  return values
    .map((value) => `"${String(value).split('"').join('""')}"`)
    .join(',');
}

export function buildCsv(bundle: CareDataBundle): string {
  const lines: string[] = [];

  lines.push('Pulse Dashboard');
  lines.push(toCsvRow(['careStatus', 'oneBigThing', 'updatedAt', 'updatedBy']));
  lines.push(
    toCsvRow([
      bundle.pulse.careStatus,
      bundle.pulse.oneBigThing,
      bundle.pulse.updatedAt,
      bundle.pulse.updatedBy
    ])
  );

  lines.push('');
  lines.push('Clinical Log');
  lines.push(
    toCsvRow([
      'id',
      'bloodPressure',
      'pulse',
      'speechClarity',
      'mobilityLevel',
      'mood',
      'createdAt',
      'createdBy'
    ])
  );
  bundle.clinicalLog.forEach((entry) => {
    lines.push(
      toCsvRow([
        entry.id,
        entry.bloodPressure,
        entry.pulse,
        entry.speechClarity,
        entry.mobilityLevel,
        entry.mood,
        entry.createdAt,
        entry.createdBy
      ])
    );
  });

  lines.push('');
  lines.push('Visit Log');
  lines.push(toCsvRow(['id', 'visitor', 'updateSentence', 'nextStep', 'createdAt']));
  bundle.visitLog.forEach((entry) => {
    lines.push(
      toCsvRow([entry.id, entry.visitor, entry.updateSentence, entry.nextStep, entry.createdAt])
    );
  });

  lines.push('');
  lines.push('Therapy');
  lines.push(toCsvRow(['id', 'discipline', 'minutes', 'win', 'createdAt', 'createdBy']));
  bundle.therapy.forEach((entry) => {
    lines.push(
      toCsvRow([
        entry.id,
        entry.discipline,
        entry.minutes,
        entry.win,
        entry.createdAt,
        entry.createdBy
      ])
    );
  });

  lines.push('');
  lines.push('Activities');
  lines.push(toCsvRow(['id', 'category', 'note', 'createdAt', 'createdBy']));
  bundle.activities.forEach((entry) => {
    lines.push(
      toCsvRow([entry.id, entry.category, entry.note, entry.createdAt, entry.createdBy])
    );
  });

  return lines.join('\n');
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function exportJson(bundle: CareDataBundle): void {
  downloadFile(
    `ramon-care-hub-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(bundle, null, 2),
    'application/json'
  );
}

export function exportCsv(bundle: CareDataBundle): void {
  downloadFile(
    `ramon-care-hub-${new Date().toISOString().slice(0, 10)}.csv`,
    buildCsv(bundle),
    'text/csv;charset=utf-8'
  );
}
