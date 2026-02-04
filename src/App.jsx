import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

import Dashboard from "./Pages/Dashboard.jsx"
import Requisition from "./Pages/Requisition.jsx";
import Login from "./Pages/Login.jsx";
import Products from "./Pages/Products.jsx";
import Vendor from "./Pages/Vendor.jsx";
import VendorAssignment from "./Pages/VendorAssignment.jsx";
import VendorQuotations from "./Pages/VendorQuotation.jsx";
import PurchaseOrderList from "./Pages/PurchaseOrderList.jsx";
import Pending from "./Pages/pending.jsx";

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
              <Route path="/sales" element={<Pending />} />
              <Route path="/requisition" element={<Requisition />} />
              <Route path="/vendor-assignment" element={<VendorAssignment />} />
              <Route path="/vendor-quotation" element={<VendorQuotations />} />
              <Route path="/purchase-order" element={<PurchaseOrderList />} />
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