const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Whole days from today until `target`: today 0, tomorrow 1, yesterday -1.
 * Both sides snap to midnight so the answer does not depend on the time of day
 * the request happens to arrive.
 */
export const daysUntil = (target, from = new Date()) =>
  Math.round((startOfDay(target).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);

export const daysAgo = (n) => new Date(Date.now() - n * MS_PER_DAY);

export const isValidDate = (value) => {
  if (value === null || value === undefined || value === '') return false;
  return !Number.isNaN(new Date(value).getTime());
};
