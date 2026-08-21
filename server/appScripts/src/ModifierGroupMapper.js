function rowToModifierGroup(row) {
  return {
    id: String(row[0] || ''),
    name: String(row[1] || '')
  };
}
