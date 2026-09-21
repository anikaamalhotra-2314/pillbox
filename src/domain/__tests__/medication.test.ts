import { emptyDraft, hasErrors, toDraft, toMedication, validateDraft, withTime, type MedicationDraft } from '../medication';

const valid = (over: Partial<MedicationDraft> = {}): MedicationDraft => ({
  ...emptyDraft(), name: 'Synthroid', dosage: '125mg', times: ['06:30'], ...over,
});

describe('validateDraft', () => {
  it('accepts a complete draft, with notes left blank (decision 0010)', () => {
    expect(hasErrors(validateDraft(valid({ notes: '' })))).toBe(false);
  });
  it('requires a title and a dosage, ignoring whitespace', () => {
    expect(validateDraft(valid({ name: '   ' })).name).toBeDefined();
    expect(validateDraft(valid({ dosage: '' })).dosage).toBeDefined();
  });
  it('requires at least one day and one time', () => {
    expect(validateDraft(valid({ days: [] })).days).toBeDefined();
    expect(validateDraft(valid({ times: [] })).times).toBeDefined();
  });
  it('accepts a grace window from 1 to 180 whole minutes only', () => {
    for (const ok of ['1', '30', '180']) expect(validateDraft(valid({ graceMinutes: ok })).graceMinutes).toBeUndefined();
    for (const bad of ['', '0', '181', '-5', '1.5', 'abc']) expect(validateDraft(valid({ graceMinutes: bad })).graceMinutes).toBeDefined();
  });
  it('reports every problem at once', () => {
    expect(Object.keys(validateDraft(emptyDraft())).sort()).toEqual(['dosage', 'name', 'times']);
  });
});

describe('emptyDraft', () => {
  it('defaults to every day, alerts on, and a 30 minute grace window (decision 0008)', () => {
    const d = emptyDraft();
    expect(d.days).toHaveLength(7);
    expect(d.alertsEnabled).toBe(true);
    expect(d.graceMinutes).toBe('30');
  });
});

describe('toMedication', () => {
  it('trims text, drops empty notes, and orders days and times', () => {
    const m = toMedication(valid({ name: ' Synthroid ', notes: '  ', days: ['sun', 'mon', 'wed'], times: ['19:00', '06:30', '19:00'], graceMinutes: '15' }), 'x1');
    expect(m).toEqual({
      id: 'x1', name: 'Synthroid', dosage: '125mg', days: ['mon', 'wed', 'sun'], times: ['06:30', '19:00'], graceMinutes: 15, alertsEnabled: true,
    });
    expect('notes' in m).toBe(false);
  });
  it('keeps notes when given', () => {
    expect(toMedication(valid({ notes: ' 1 pill ' }), 'x').notes).toBe('1 pill');
  });
  it('round-trips through toDraft', () => {
    const m = toMedication(valid({ notes: '1 pill' }), 'x');
    expect(toMedication(toDraft(m), 'x')).toEqual(m);
  });
});

describe('withTime', () => {
  it('keeps the list sorted and free of duplicates', () => {
    expect(withTime(['19:00', '06:30'], '13:00')).toEqual(['06:30', '13:00', '19:00']);
    expect(withTime(['06:30'], '06:30')).toEqual(['06:30']);
  });
  it('replaces a time when editing', () => {
    expect(withTime(['06:30', '19:00'], '07:00', '06:30')).toEqual(['07:00', '19:00']);
  });
});
