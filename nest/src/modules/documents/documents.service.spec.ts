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
  it('calculates document expiry from the hardcoded date', async () => {
    process.env.REFERENCE_DATE = '2026-05-31';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'));

    const documents = await new DocumentsService().getDocuments();
    const license = documents.find((document) => document.id === 'doc_license');
    const medical = documents.find((document) => document.id === 'doc_medical');
    const security = documents.find((document) => document.id === 'doc_security');

    expect(license).toMatchObject({
      daysRemaining: 14,
      status: 'soon',
      badge: '14d left',
    });
    expect(medical).toMatchObject({
      daysRemaining: 27,
      status: 'soon',
      badge: '27d left',
    });
    expect(security).toMatchObject({
      daysRemaining: -14,
      status: 'expired',
      badge: '14d ago',
    });
  });
});
