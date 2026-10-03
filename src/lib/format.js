// Display helpers shared by every screen. Amounts from the API are peso
// numbers (e.g. 1850.5); these only format them — the server does the math.

const pesoFormat = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1850.5 → "₱1,850.50" */
export const peso = (amount) => `₱${pesoFormat.format(Math.abs(Number(amount) || 0))}`;

/** 450 → "+₱450.00", -80.5 → "-₱80.50", 0 → "₱0.00" */
export const signedPeso = (amount) => {
  const n = Number(amount) || 0;
  if (n > 0) return `+${peso(n)}`;
  if (n < 0) return `-${peso(n)}`;
  return peso(0);
};

/** Split into the dashboard's big-number parts: { sign: '+₱', whole: '1,450', cents: '.50' } */
export const pesoParts = (amount) => {
  const n = Number(amount) || 0;
  const [whole, cents] = pesoFormat.format(Math.abs(n)).split('.');
  return { sign: `${n < 0 ? '-' : n > 0 ? '+' : ''}₱`, whole, cents: `.${cents}` };
};

/** Human balance line for a group card, from the API's statusType. */
export const balanceText = (balance, statusType) => {
  if (statusType === 'owe') return `You owe ${peso(balance)}`;
  if (statusType === 'owed') return `You are owed ${peso(balance)}`;
  return 'Settled';
};

/** '2026-10-03' or an ISO timestamp → "Oct 3, 2026" */
export const formatDate = (value) => {
  if (!value) return '';
  const date = typeof value === 'string' && value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Today as 'YYYY-MM-DD' in the user's own time zone. */
export const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** ISO timestamp → "Just now", "5m ago", "3h ago", "Yesterday", "Oct 1" */
export const timeAgo = (value) => {
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 172800) return 'Yesterday';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** "Bea Santos" → "BS", "Miguel" → "MI" */
export const initials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || '?').slice(0, 2).toUpperCase();
};

/** Payment method id → label shown in the UI. */
export const METHOD_LABELS = { cash: 'Cash', gcash: 'GCash', maya: 'Maya', bank: 'Bank Transfer' };
