function rowToMenuItem(row) {
  return {
    id: String(row[0] || ''),
    menuId: String(row[1] || ''),
    productId: String(row[2] || ''),
    displayName: String(row[3] || ''),
    descriptionOverride: String(row[4] || ''),
    basePricePence: parseMenuItemNonNegativeInteger(row[5], 0),
    sortOrder: parseMenuItemNonNegativeInteger(row[6], 0),
    isActive: parseMenuItemIsActive(row[7]),
    createdAt: String(row[8] || ''),
    updatedAt: String(row[9] || '')
  };
}

function parseMenuItemNonNegativeInteger(value, fallback) {
  var number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return fallback;
  }

  return Math.floor(number);
}

function parseMenuItemIsActive(value) {
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
