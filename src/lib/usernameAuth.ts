export function normalizeUsername(value: string): string {
  return value.trim().normalize("NFKC").toLowerCase();
}

export function usernameToAuthEmail(username: string): string {
  const normalized = normalizeUsername(username);
  const bytes = new TextEncoder().encode(normalized);
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `u-${hex}@teacherhub.local`;
}
