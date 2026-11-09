import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

import {
  getReferenceDate,
  parseDateOnly,
} from '../../common/reference-date.js';

export type DocumentStatus = 'safe' | 'soon' | 'expired';

interface DocumentEntry {
  id: string;
  label: string;
  expiryDate: string;
}

interface DocumentDataset {
  thresholds: {
    warningDays: number;
  };
  documents: DocumentEntry[];
}

export interface DocumentItem extends DocumentEntry {
  status: DocumentStatus;
  daysRemaining: number;
  badge: string;
}

function getDaysRemaining(today: Date, expiryDate: Date): number {
  const diffMs = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

@Injectable()
export class DocumentsService {
  private readonly dataPath = new URL(
    '../../../../mock-documents.json',
    import.meta.url,
  );

  private async loadDataset(): Promise<DocumentDataset> {
    const raw = await readFile(this.dataPath, 'utf8');
    return JSON.parse(raw) as DocumentDataset;
  }

  async getDocuments(): Promise<DocumentItem[]> {
    const dataset = await this.loadDataset();
    const referenceDate = getReferenceDate();

    return dataset.documents.map((document) => {
      const expiryDate = parseDateOnly(document.expiryDate);
      const daysRemaining = getDaysRemaining(referenceDate, expiryDate);

      let status: DocumentStatus = 'safe';
      let badge = `${daysRemaining}d left`;

      if (daysRemaining <= 0) {
        status = 'expired';
        badge = `${Math.abs(daysRemaining)}d ago`;
      } else if (daysRemaining <= dataset.thresholds.warningDays) {
        status = 'soon';
      }

      return {
        ...document,
        status,
        daysRemaining,
        badge,
      };
    });
  }
}
