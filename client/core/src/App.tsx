import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from '@/components/layout/app-layout'
import { CustomerProfilePage } from '@/pages/customers/CustomerProfilePage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { ReportPage } from '@/pages/report/ReportPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/customers" replace />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:customerId" element={<CustomerProfilePage />} />
        <Route path="report" element={<ReportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  )
}

export default App
