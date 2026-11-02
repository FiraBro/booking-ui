/** Only follow redirects to https URLs (or same-origin paths). Anything else is treated as invalid. */
export function isSafeRedirectUrl(value: string): boolean {
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin || url.protocol === "https:";
  } catch {
    return false;
  }
}
