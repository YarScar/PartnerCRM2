// Route ids like /api/partners/12. parseInt alone accepts "12abc" and turns "abc"
// into NaN, which reached Prisma and came back as a 500.
export function parseId(raw: string): number | null {
  if (!/^\d{1,9}$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 ? id : null;
}
