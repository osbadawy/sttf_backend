import { BadRequestException } from '@nestjs/common';

export function coerceValue(attr: any, val: any): any {
    const type = attr?.type;
    const key =
      (type && (type.key || type.toSql?.() || type.constructor?.key)) ||
      String(type || '');

    // JSONB
    if (/JSON/i.test(String(key))) {
      if (val == null) return null;
      if (typeof val === 'object') return val;
      try {
        return JSON.parse(String(val));
      } catch {
        throw new BadRequestException(`Invalid JSON for field "${attr.fieldName || attr.field}"`);
      }
    }

    // ENUM
    if (typeof (type as any)?.values?.includes === 'function') {
      const v = String(val).trim();
      if (!(type as any).values.includes(v)) {
        throw new BadRequestException(
          `Invalid value "${v}" for "${attr.fieldName || attr.field}". Allowed: ${(type as any).values.join(', ')}`
        );
      }
      return v;
    }

    // DECIMAL -> your model maps these as strings; accept number or string
    if (/DECIMAL/i.test(String(key))) {
      if (val == null) return null;
      const s = typeof val === 'number' ? val.toString() : String(val).trim();
      if (!/^-?\d+(\.\d+)?$/.test(s)) {
        throw new BadRequestException(
          `Invalid decimal for "${attr.fieldName || attr.field}": ${val}`
        );
      }
      return s;
    }

    // Numeric types
    if (/(INTEGER|BIGINT|FLOAT|DOUBLE|REAL)/i.test(String(key))) {
      if (val == null || val === '') return null;
      const num = Number(val);
      if (!Number.isFinite(num)) {
        throw new BadRequestException(
          `Invalid number for "${attr.fieldName || attr.field}": ${val}`
        );
      }
      // integers get floored just in case
      return /INTEGER|BIGINT/i.test(String(key)) ? Math.trunc(num) : num;
    }

    // UUID or strings: normalize to trimmed string (allow null)
    if (/UUID|CHAR|STRING|TEXT/i.test(String(key))) {
      if (val == null) return null;
      return String(val).trim();
    }

    // Fallback: return as-is
    return val;
  }