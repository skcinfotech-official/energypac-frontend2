import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

import Dashboard from "./Pages/Dashboard.jsx"
import SalesDashboard from "./Pages/SalesDashboard.jsx";
import Requisition from "./Pages/Requisition.jsx";
import Login from "./Pages/Login.jsx";
import Products from "./Pages/Products.jsx";
import Vendor from "./Pages/Vendor.jsx";
import VendorAssignment from "./Pages/VendorAssignment.jsx";
import VendorQuotations from "./Pages/VendorQuotation.jsx";
import PurchaseOrderList from "./Pages/PurchaseOrderList.jsx";
import SalesStatistics from "./Pages/SalesStatistics.jsx";
import SalesPerformance from "./Pages/SalesPerformance.jsx";
import ProductSalesAnalysis from "./Pages/ProductSalesAnalysis.jsx";
import Pending from "./Pages/pending.jsx";
import Enquiry from "./Pages/Enquiry.jsx";
import DirectPurchase from "./Pages/DirectPurchase.jsx";
import ClientQuotation from "./Pages/ClientQuotation.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/master/item" element={<Products />} />
              <Route path="/master/vendor" element={<Vendor />} />
              <Route path="/sales/dashboard" element={<SalesDashboard />} />
              <Route path="/requisition" element={<Requisition />} />
              <Route path="/vendor-assignment" element={<VendorAssignment />} />
              <Route path="/vendor-quotation" element={<VendorQuotations />} />
              <Route path="/purchase-order" element={<PurchaseOrderList />} />
              <Route path="/sales/client-query" element={<Enquiry />} />
              <Route path="/sales/client-quotation" element={<ClientQuotation />} />
              <Route path="/sales/sales-statistics" element={<SalesStatistics />} />
              <Route path="/sales/sales-performance" element={<SalesPerformance />} />
              <Route path="/sales/sales-products" element={<ProductSalesAnalysis />} />
              <Route path="/direct-purchase" element={<DirectPurchase />} />
              {/* <Route path="/export-data" element={<Pending />} />
              <Route path="/export-log" element={<Pending />} /> */}
              <Route path="/HSN" element={<Pending />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
