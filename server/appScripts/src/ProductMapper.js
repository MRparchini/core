function rowToProduct(row) {
  return {
    id: String(row[0] || ''),
    name: String(row[1] || ''),
    kitchenName: String(row[2] || ''),
    category: String(row[3] || ''),
    isActive: parseProductIsActive(row[4]),
    description: String(row[5] || ''),
    createdAt: String(row[6] || ''),
    updatedAt: String(row[7] || '')
  };
}

function parseProductIsActive(value) {
  if (value === true) {
    return true;
  }

  var normalizedValue = String(value || '').trim().toLowerCase();

  return normalizedValue === '' ||
    normalizedValue === 'true' ||
    normalizedValue === 'yes' ||
    normalizedValue === '1' ||
    normalizedValue === 'active';
}
