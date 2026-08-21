function rowToCategory(row) {
  return {
    id: String(row[0] || ''),
    name: String(row[1] || ''),
    color: String(row[2] || ''),
    applyColorToAllItems: parseCategoryApplyColorToAllItems(row[3])
  };
}

function parseCategoryApplyColorToAllItems(value) {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  var normalizedValue = String(value === undefined || value === null ? '' : value).trim().toLowerCase();

  return normalizedValue === 'true' ||
    normalizedValue === 'yes' ||
    normalizedValue === '1';
}
