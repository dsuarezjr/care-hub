import { describe, expect, it } from 'vitest';
import { __testables } from '../src/services/storage/cloudSync';

describe('cloudSync merge behavior', () => {
  it('keeps latest entry by id when duplicates exist', () => {
    const merged = __testables.mergeById(
      [
        { id: 'a', createdAt: '2026-04-02T12:00:00.000Z', value: 'old-local' },
        { id: 'b', createdAt: '2026-04-02T12:10:00.000Z', value: 'only-local' }
      ],
      [
        { id: 'a', createdAt: '2026-04-02T12:30:00.000Z', value: 'new-remote' },
        { id: 'c', createdAt: '2026-04-02T12:20:00.000Z', value: 'only-remote' }
      ]
    );

    const ids = merged.map((item) => item.id);
    expect(ids).toEqual(['a', 'c', 'b']);
    expect(merged[0].value).toBe('new-remote');
  });

  it('prefers pulse with newer updatedAt', () => {
    const chosen = __testables.mergePulse(
      {
        careStatus: 'Stable',
        oneBigThing: 'Local value',
        updatedAt: '2026-04-02T10:00:00.000Z',
        updatedBy: 'Local'
      },
      {
        careStatus: 'Alert',
        oneBigThing: 'Remote value',
        updatedAt: '2026-04-02T11:00:00.000Z',
        updatedBy: 'Remote'
      }
    );

    expect(chosen.careStatus).toBe('Alert');
    expect(chosen.updatedBy).toBe('Remote');
  });
});
