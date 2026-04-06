export const getFoodImage = (category: string, name: string): string => {
  const seed = `${category}-${name}`.replace(/\s+/g, '-').toLowerCase();
  return `https://picsum.photos/seed/${seed}/400/400`;
};
