export type SensitiveSharedIntelField =
  | "deliverFromDetails"
  | "approachHint"
  | "checkInNotes"
  | "notes";

export type SensitiveSharedIntelMatch = {
  field: SensitiveSharedIntelField;
  label: string;
  text: string;
};

type SensitiveSharedIntelDraft = Record<SensitiveSharedIntelField, string>;

const EXPLICIT_SECRET_PATTERN =
  /\b(?:password|passcode|keypad\s+code|gate\s+code|door\s+code|alarm\s+code|access\s+code|entry\s+code|security\s+code)\b/i;
const CONTEXTUAL_PIN_PATTERN =
  /(?:\b(?:gate|door|alarm|access|entry|keypad)\b.{0,24}\bpin\b|\bpin\b\s*(?::|is\b|=)\s*[a-z0-9#*\-]{3,})/i;

const FIELD_LABELS: Record<SensitiveSharedIntelField, string> = {
  deliverFromDetails: "Delivery-side details",
  approachHint: "Best approach",
  checkInNotes: "Check-in notes",
  notes: "Driver notes",
};

export function findSensitiveSharedIntel(
  draft: SensitiveSharedIntelDraft,
): SensitiveSharedIntelMatch[] {
  return (Object.keys(FIELD_LABELS) as SensitiveSharedIntelField[]).flatMap((field) => {
    const text = draft[field].trim();
    if (!text || (!EXPLICIT_SECRET_PATTERN.test(text) && !CONTEXTUAL_PIN_PATTERN.test(text))) {
      return [];
    }

    return [{ field, label: FIELD_LABELS[field], text }];
  });
}

export function composeLockedIntelTransfer(matches: SensitiveSharedIntelMatch[]): string {
  return matches.map(({ label, text }) => `${label}: ${text}`).join("\n\n");
}
