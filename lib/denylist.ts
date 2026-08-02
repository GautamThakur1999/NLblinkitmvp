/**
 * EC-S1, EC-S2, EC-S3, EC-S7
 * This file contains the strict, code-level array of blocked sensitive categories.
 * This MUST run before any model invocation (INV-7).
 */

export const SENSITIVE_CATEGORIES_DENYLIST = [
  "pregnancy",
  "fertility",
  "contraceptive",
  "intimate",
  "pharma", // blocked as a suggestion, allowed as an anchor
  "weight-loss",
  "diet"
];

export function isSensitiveCategory(categoryName: string): boolean {
  const normalized = categoryName.toLowerCase();
  return SENSITIVE_CATEGORIES_DENYLIST.some(blocked => normalized.includes(blocked));
}
