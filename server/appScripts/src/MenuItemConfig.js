var MENU_ITEM_CONFIG = {
  SHEET_NAME: 'MenuItems',
  HEADER_ROW: CONFIG.HEADER_ROW,
  FIRST_DATA_ROW: CONFIG.FIRST_DATA_ROW,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  COLUMNS: {
    id: 1,
    menuId: 2,
    productId: 3,
    displayName: 4,
    descriptionOverride: 5,
    basePricePence: 6,
    sortOrder: 7,
    isActive: 8,
    createdAt: 9,
    updatedAt: 10
  },
  TOTAL_COLUMNS: 10,
  HEADERS: [
    'ID',
    'MenuID',
    'ProductID',
    'DisplayName',
    'DescriptionOverride',
    'BasePricePence',
    'SortOrder',
    'IsActive',
    'CreatedAt',
    'UpdatedAt'
  ]
};
