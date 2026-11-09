import { afterEach, describe, expect, it, vi } from 'vitest';

import { DocumentsService } from './documents.service.js';

const originalReferenceDate = process.env.REFERENCE_DATE;

afterEach(() => {
  if (originalReferenceDate === undefined) {
    delete process.env.REFERENCE_DATE;
  } else {
    process.env.REFERENCE_DATE = originalReferenceDate;
  }

  vi.useRealTimers();
});

describe('DocumentsService', () => {
  it('calculates document expiry from REFERENCE_DATE when configured', async () => {
    process.env.REFERENCE_DATE = '2026-05-31';

    const documents = await new DocumentsService().getDocuments();
    const license = documents.find((document) => document.id === 'doc_license');
    const medical = documents.find((document) => document.id === 'doc_medical');

    expect(license).toMatchObject({
      daysRemaining: -2,
      status: 'expired',
      badge: '2d ago',
    });
    expect(medical).toMatchObject({
      daysRemaining: 11,
      status: 'soon',
      badge: '11d left',
    });
  });

  it('falls back to today's date when REFERENCE_DATE is empty', async () => {
    process.env.REFERENCE_DATE = '';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'));

    const documents = await new DocumentsService().getDocuments();
    const license = documents.find((document) => document.id === 'doc_license');
    const medical = documents.find((document) => document.id === 'doc_medical');

    expect(license).toMatchObject({
      daysRemaining: -3,
      status: 'expired',
      badge: '3d ago',
    });
    expect(medical).toMatchObject({
      daysRemaining: 10,
      status: 'soon',
      badge: '10d left',
    });
  });
});
