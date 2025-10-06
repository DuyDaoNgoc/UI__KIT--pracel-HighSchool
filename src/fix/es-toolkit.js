export const noop = () => {};
export const sortBy = (arr, fn) =>
  Array.isArray(arr) ? [...arr].sort((a, b) => fn(a) - fn(b)) : arr;
export default { noop, sortBy };
