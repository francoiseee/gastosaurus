// Money helpers. All arithmetic happens in integer CENTAVOS so we never lose
// a centavo to floating point (0.1 + 0.2 !== 0.3 in JavaScript).
//
//   toCentavos('123.45') === 12345      toCentavos(10.1) === 1010
//   fromCentavos(12345) === 123.45      formatPeso(12345) === '₱123.45'

/** Peso amount (number or numeric string from pg) → integer centavos. */
export function toCentavos(value) {
  if (value === null || value === undefined) return 0;
  const str = typeof value === 'number' ? value.toFixed(2) : String(value).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(str)) throw new Error(`Not a peso amount: ${value}`);
  const negative = str.startsWith('-');
  const [whole, frac = ''] = str.replace('-', '').split('.');
  const centavos = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return negative ? -centavos : centavos;
}

/** Integer centavos → peso number with 2 decimals (for JSON responses). */
export function fromCentavos(centavos) {
  return Math.round(centavos) / 100;
}

/** Integer centavos → string pg can store exactly in numeric(12,2). */
export function centavosToNumeric(centavos) {
  const sign = centavos < 0 ? '-' : '';
  const abs = Math.abs(centavos);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

export function formatPeso(centavos) {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 'owed' | 'owe' | 'settled' — the dashboard's statusType for a net balance. */
export function statusFor(netCentavos) {
  if (netCentavos > 0) return 'owed';
  if (netCentavos < 0) return 'owe';
  return 'settled';
}
