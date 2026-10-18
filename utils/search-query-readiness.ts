export type FreightIqSearchScope = "all" | "stops" | "cities" | "drivers";

export function searchCharacterCount(value: string) {
  let count = 0;

  for (const character of value.trim()) {
    if (
      (character >= "0" && character <= "9") ||
      character.toLocaleLowerCase() !== character.toLocaleUpperCase()
    ) {
      count += 1;
    }
  }

  return count;
}

export function stopSearchIsReady(value: string) {
  return searchCharacterCount(value) >= 2;
}

export function discoverySearchIsReady(value: string) {
  return searchCharacterCount(value) >= 3;
}

export function scopedSearchIsReady(value: string, scope: FreightIqSearchScope) {
  return scope === "all" || scope === "stops"
    ? stopSearchIsReady(value)
    : discoverySearchIsReady(value);
}

export function searchMinimumMessage(scope: FreightIqSearchScope) {
  return scope === "all" || scope === "stops"
    ? "Enter at least 2 letters or numbers"
    : "Enter at least 3 letters or numbers";
}
