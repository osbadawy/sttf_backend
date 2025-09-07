// src/user/util/helper.ts (or wherever you keep it)
import { BadRequestException } from '@nestjs/common';

export type AttrMeta = {
  type: unknown;
  fieldName?: string;
  field?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object';
}

function fieldLabel(attr: AttrMeta): string {
  return attr.fieldName || attr.field || 'unknown';
}
