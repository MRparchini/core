import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from '@/components/layout/app-layout'
import { BillingPage } from '@/pages/billing/BillingPage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { ReportPage } from '@/pages/report/ReportPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/customers" replace />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="billing" element={<BillingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  )
}

export default App
