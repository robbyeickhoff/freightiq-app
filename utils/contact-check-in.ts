export const CONTACT_PHONE_TYPES = ["mobile", "work_mobile", "receiving", "office"] as const;

export type ContactPhoneType = (typeof CONTACT_PHONE_TYPES)[number];

export type ContactPhone = {
  type: ContactPhoneType | null;
  number: string;
};

export type StructuredContact = {
  contactName: string;
  phones: ContactPhone[];
  checkInNotes: string;
};

export const CONTACT_PHONE_LABELS: Record<ContactPhoneType, string> = {
  mobile: "Mobile",
  work_mobile: "Work Mobile",
  receiving: "Receiving",
  office: "Office",
};

export function canMessagePhoneType(type: ContactPhoneType | null): boolean {
  return type === "mobile" || type === "work_mobile";
}

export function isContactPhoneType(value: unknown): value is ContactPhoneType {
  return typeof value === "string" && CONTACT_PHONE_TYPES.includes(value as ContactPhoneType);
}

export function phoneTypeLabel(type: ContactPhoneType | null): string {
  return type ? CONTACT_PHONE_LABELS[type] : "Phone";
}

export function phoneDigits(number: string): string {
  return number.replace(/\D/g, "");
}

export function dialablePhone(number: string): string {
  const digits = phoneDigits(number);
  return number.trim().startsWith("+") ? `+${digits}` : digits;
}

export function isValidPhone(number: string): boolean {
  const length = phoneDigits(number).length;
  return length >= 7 && length <= 15;
}

export function formatPhoneInput(value: string): string {
  const trimmed = value.trimStart();
  const digits = phoneDigits(trimmed);
  const hasInternationalPrefix = trimmed.startsWith("+");

  if (hasInternationalPrefix && !(digits.length === 11 && digits.startsWith("1"))) {
    return trimmed.slice(0, 24);
  }

  const localDigits =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1, 11) : digits.slice(0, 10);

  if (localDigits.length <= 3) return localDigits;
  if (localDigits.length <= 6) return `(${localDigits.slice(0, 3)}) ${localDigits.slice(3)}`;

  return `(${localDigits.slice(0, 3)}) ${localDigits.slice(3, 6)}-${localDigits.slice(6)}`;
}

export function formatPhoneDisplay(value: string): string {
  const digits = phoneDigits(value);

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return value.trim();
}

export function sanitizeContactPhones(value: unknown): ContactPhone[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 5)
    .map((row): ContactPhone | null => {
      if (!row || typeof row !== "object") return null;

      const candidate = row as { type?: unknown; number?: unknown };
      if (typeof candidate.number !== "string" || !isValidPhone(candidate.number)) return null;

      return {
        type: isContactPhoneType(candidate.type) ? candidate.type : null,
        number: formatPhoneDisplay(candidate.number),
      };
    })
    .filter((row): row is ContactPhone => row !== null);
}

const LEGACY_PHONE_PATTERN = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

export function adaptLegacyContact(contact: string | null | undefined): StructuredContact {
  const source = contact?.trim() ?? "";
  if (!source) return { contactName: "", phones: [], checkInNotes: "" };

  const matches = [...source.matchAll(LEGACY_PHONE_PATTERN)].slice(0, 5);
  const phones = matches.map((match) => ({
    type: null,
    number: formatPhoneDisplay(match[0]),
  }));
  const checkInNotes = source
    .replace(LEGACY_PHONE_PATTERN, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;|])/g, "$1")
    .trim();

  return { contactName: "", phones, checkInNotes };
}

export function readStructuredContact(report: {
  contact?: string | null;
  contact_name?: string | null;
  contact_phones?: unknown;
  check_in_notes?: string | null;
}): StructuredContact {
  const structuredPhones = sanitizeContactPhones(report.contact_phones);
  const hasStructuredValue = Boolean(
    report.contact_name?.trim() || structuredPhones.length || report.check_in_notes?.trim(),
  );

  if (!hasStructuredValue) return adaptLegacyContact(report.contact);

  return {
    contactName: report.contact_name?.trim() ?? "",
    phones: structuredPhones,
    checkInNotes: report.check_in_notes?.trim() ?? "",
  };
}

export function composeLegacyContact(contact: StructuredContact): string | null {
  const lines = [
    contact.contactName.trim(),
    ...contact.phones
      .filter((phone) => isValidPhone(phone.number))
      .map((phone) => `${phoneTypeLabel(phone.type)}: ${formatPhoneDisplay(phone.number)}`),
    contact.checkInNotes.trim(),
  ].filter(Boolean);

  return lines.length ? lines.join("\n") : null;
}
