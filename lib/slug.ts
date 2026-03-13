export function generateSlug(): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error("Web Crypto API is not available");
  }

  const timestamp = Date.now().toString().padStart(13, "0").slice(-13);
  const prefixLength = 64 - 13;
  const bytes = new Uint8Array(Math.ceil(prefixLength / 8));
  cryptoApi.getRandomValues(bytes);

  let prefix = "";
  for (const byte of bytes) {
    for (let bit = 0; bit < 8; bit += 1) {
      prefix += (byte >> bit) & 1 ? "O" : "o";
      if (prefix.length === prefixLength) break;
    }
    if (prefix.length === prefixLength) break;
  }

  return `${prefix}${timestamp}`;
}
