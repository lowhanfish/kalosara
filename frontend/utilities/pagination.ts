export const listindex = (
  limit: number,
  pageSelect: number,
  index: number,
): number => {
  return limit * (pageSelect - 1) + index + 1;
};
