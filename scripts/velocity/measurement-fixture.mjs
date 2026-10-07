// Deliberately artificial contract fixture; never used as published field evidence.
export const fixture = () => [{
  id: 'tissue-mapped', title: 'Contract test', instrument: 'performance_curves', lens: 'capability', unit: 'mm³',
  description: 'Test description', coverage: 'Test coverage', caveat: 'Test caveat', checkedAt: '2026-09-09',
  chartKind: 'scatter', scale: 'log', tracks: [{ id: 'test-track', label: 'Test track', definition: 'Test definition', points: [{
    date: '2024-01-01', datePrecision: 'year', dateBasis: 'publication', value: 0.001,
    label: 'Test point', sourceUrl: 'https://example.org/test', sourceLabel: 'Test source', note: 'Test note',
  }] }],
}]

