export const parseExpiry = (str: string): number => {
  const match = /^(\d+)([smhd])$/.exec(str);
  if (!match) return 0;
  const [_, amount, unit] = match;
  const multiplier = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] ?? 0;
  return parseInt(amount) * multiplier;
};
