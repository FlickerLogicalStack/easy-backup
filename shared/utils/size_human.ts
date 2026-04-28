const UNITS = ['Bytes', 'KB', 'MB', 'GB'];

export const size_human = (bytes: number | null | undefined, decimals = 2) => {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) {
    return 'Unknown';
  }

  if (bytes === 0) {
    return '0 Bytes';
  }

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  const decimalPlaces = i === 0 ? 0 : decimals;

  return `${size.toFixed(decimalPlaces)} ${UNITS[i]}`;
};
