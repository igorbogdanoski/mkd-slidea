const CODE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// One random byte per character via crypto.getRandomValues, mapped into a
// 36-symbol alphabet — always exactly `length` characters. A naive
// `.toString(36)` per byte produces a variable-length string (a byte < 36
// encodes to a single base36 char), so ~1% of codes came out shorter than
// intended and could never be entered on a fixed-length input.
export function generateCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map(b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}
