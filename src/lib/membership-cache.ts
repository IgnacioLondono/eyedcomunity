export function membershipCacheValue(status: number): boolean | null {
  if (status >= 200 && status < 300) return true;
  if (status === 403 || status === 404) return false;
  return null;
}
