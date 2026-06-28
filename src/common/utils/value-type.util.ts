import { BadRequestException } from '@nestjs/common';

/**
 * Validates that a string value matches the declared value_type from a
 * definition row. Values are always stored as TEXT, so this guards what gets
 * written into realm_settings / user_attributes.
 */
export function validateValueType(value: string, valueType: string): void {
  switch (valueType) {
    case 'boolean':
      if (value !== 'true' && value !== 'false') {
        throw new BadRequestException("Expected a boolean ('true' or 'false')");
      }
      break;
    case 'int':
      if (!/^-?\d+$/.test(value)) {
        throw new BadRequestException('Expected an integer');
      }
      break;
    case 'decimal':
      if (value.trim() === '' || isNaN(Number(value))) {
        throw new BadRequestException('Expected a number');
      }
      break;
    case 'json':
      try {
        JSON.parse(value);
      } catch {
        throw new BadRequestException('Expected valid JSON');
      }
      break;
    // string | text | date | timestamp: stored as-is
    default:
      break;
  }
}
