function rowToMenu(row) {
  return {
    id: String(row[0] || ''),
    name: String(row[1] || ''),
    description: String(row[2] || ''),
    sortOrder: parseMenuSortOrder(row[3]),
    isActive: parseMenuIsActive(row[4]),
    createdAt: String(row[5] || ''),
    updatedAt: String(row[6] || '')
  };
}

function parseMenuSortOrder(value) {
  var number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.floor(number);
}

function parseMenuIsActive(value) {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  var normalizedValue = String(value === undefined || value === null ? '' : value).trim().toLowerCase();

  return normalizedValue === '' ||
    normalizedValue === 'true' ||
    normalizedValue === 'yes' ||
    normalizedValue === '1' ||
    normalizedValue === 'active';
}
