import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from '@/components/layout/app-layout'
import { CategoriesPage } from '@/pages/categories/CategoriesPage'
import { CustomerProfilePage } from '@/pages/customers/CustomerProfilePage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { MenuItemsPage } from '@/pages/menu-items/MenuItemsPage'
import { MenusPage } from '@/pages/menus/MenusPage'
import { ModifierGroupsPage } from '@/pages/modifier-groups/ModifierGroupsPage'
import { ProductsPage } from '@/pages/products/ProductsPage'
import { ReportPage } from '@/pages/report/ReportPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/customers" replace />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:customerId" element={<CustomerProfilePage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="menus" element={<MenusPage />} />
        <Route path="menu-items" element={<MenuItemsPage />} />
        <Route path="modifier-groups" element={<ModifierGroupsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="report" element={<ReportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  )
}

export default App
