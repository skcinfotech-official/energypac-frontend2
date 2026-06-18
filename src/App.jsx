import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SnackbarProvider } from "notistack";
import theme from "./theme";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";

import Dashboard from "./Pages/Dashboard.jsx"
import SalesDashboard from "./Pages/SalesDashboard.jsx";
import Requisition from "./Pages/Requisition.jsx";
import RequisitionFormPage from "./Pages/RequisitionFormPage.jsx";
import Login from "./Pages/Login.jsx";
import Products from "./Pages/Products.jsx";
import Vendor from "./Pages/Vendor.jsx";
import Currency from "./Pages/Currency.jsx";
import VendorAssignment from "./Pages/VendorAssignment.jsx";
import VendorQuotations from "./Pages/VendorQuotation.jsx";
import VendorQuotationComparison from "./Pages/VendorQuotationComparison.jsx";
import PurchaseOrderList from "./Pages/PurchaseOrderList.jsx";
import SalesStatistics from "./Pages/SalesStatistics.jsx";
import SalesPerformance from "./Pages/SalesPerformance.jsx";
import ProductSalesAnalysis from "./Pages/ProductSalesAnalysis.jsx";
import Pending from "./Pages/pending.jsx";
import Enquiry from "./Pages/Enquiry.jsx";
import DirectPurchase from "./Pages/DirectPurchase.jsx";
import ClientQuotation from "./Pages/ClientQuotation.jsx";
import CreateBill from "./Pages/CreateBill.jsx";
import BillList from "./Pages/BillList.jsx";
import FinancePOList from "./Pages/FinancePOList.jsx";
import FinanceDashboard from "./Pages/FinanceDashboard.jsx";
import PiAdvance from "./Pages/PiAdvance.jsx";
import PendingPurchase from "./Pages/PendingPurchase.jsx";
import ServiceInvoicePayments from "./Pages/ServiceInvoicePayments.jsx";
import ProformaInvoiceFormPage from "./Pages/ProformaInvoiceFormPage.jsx";
import CommercialInvoiceList from "./Pages/CommercialInvoiceList.jsx";
import TaxInvoiceList from "./Pages/TaxInvoiceList.jsx";
import RevenueAnalysis from "./Pages/RevenueAnalysis.jsx";
import ManageUsers from "./Pages/ManageUsers.jsx";
import AuditLogs from "./Pages/AuditLogs.jsx";
import TransportList from "./Pages/TransportList.jsx";
import TransportDashboard from "./Pages/TransportDashboard.jsx";
import Transporters from "./Pages/Transporters.jsx";
import DispatchBoard from "./Pages/DispatchBoard.jsx";
import TransportPayments from "./Pages/TransportPayments.jsx";
import ItemAnalytics from "./Pages/ItemAnalytics.jsx";
import InventoryAging from "./Pages/InventoryAging.jsx";
import Returns from "./Pages/Returns.jsx";
import UserGuide from "./Pages/UserGuide.jsx";
import UserProfile from "./Pages/UserProfile.jsx";
import VerifierDashboard from "./components/signature/VerifierDashboard.jsx";
import Notifications from "./Pages/Notifications.jsx";
import { useAuth } from "./context/AuthContext";


const HomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === "ADMIN") {
    return <Navigate to="/admin/users" replace />;
  }
  return <Dashboard />;
};


export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={4000}
      >
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<HomeRedirect />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/master/item" element={<Products />} />
                  <Route path="/master/vendor" element={<Vendor />} />
                  <Route path="/master/currency" element={<Currency />} />
                  <Route path="/sales/dashboard" element={<SalesDashboard />} />
                  <Route path="/requisition" element={<Requisition />} />
                  <Route path="/requisition/create" element={<RequisitionFormPage />} />
                  <Route path="/vendor-assignment" element={<VendorAssignment />} />
                  <Route path="/vendor-quotation" element={<VendorQuotations />} />
                  <Route path="/vendor-quotation-comparison" element={<VendorQuotationComparison />} />
                  <Route path="/purchase-order" element={<PurchaseOrderList />} />
                  <Route path="/sales/client-query" element={<Enquiry />} />
                  <Route path="/sales/proforma-invoice" element={<ClientQuotation />} />
                  <Route path="/sales/proforma-invoice/create" element={<ProformaInvoiceFormPage />} />
                  <Route path="/sales/proforma-invoice/:id/edit" element={<ProformaInvoiceFormPage />} />
                  <Route path="/sales/commercial-invoices" element={<CommercialInvoiceList />} />
                  <Route path="/sales/tax-invoices" element={<TaxInvoiceList kind="PRODUCT" />} />
                  <Route path="/sales/service-invoices" element={<TaxInvoiceList kind="SERVICE" />} />
                  <Route path="/sales/create-bill" element={<CreateBill />} />
                  <Route path="/finance/pi-bills" element={<BillList />} />
                  <Route path="/finance/pi-advanced" element={<PiAdvance />} />
                  <Route path="/finance/service-invoice-payments" element={<ServiceInvoicePayments />} />
                  <Route path="/purchase/pending-purchase" element={<PendingPurchase />} />
                  <Route path="/finance/revenue-analysis" element={<RevenueAnalysis />} />
                  <Route path="/transport" element={<TransportList />} />
                  <Route path="/transport/dashboard" element={<TransportDashboard />} />
                  <Route path="/transport/transporters" element={<Transporters />} />
                  <Route path="/transport/dispatch" element={<DispatchBoard />} />
                  <Route path="/transport/payments" element={<TransportPayments />} />
                  <Route path="/finance/transport-payments" element={<TransportPayments />} />
                  <Route path="/sales/sales-statistics" element={<SalesStatistics />} />
                  <Route path="/sales/sales-performance" element={<SalesPerformance />} />
                  <Route path="/sales/sales-products" element={<ProductSalesAnalysis />} />
                  <Route path="/direct-purchase" element={<DirectPurchase />} />
                  <Route path="/HSN" element={<Pending />} />
                  <Route path="/finance/dashboard" element={<FinanceDashboard />} />
                  <Route path="/finance/purchase-orders" element={<FinancePOList />} />
                  <Route path="/finance/item-analytics" element={<ItemAnalytics />} />
                  <Route path="/finance/inventory-aging" element={<InventoryAging />} />
                  <Route path="/returns" element={<Returns />} />
                  <Route path="/user-guide" element={<UserGuide />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/verifications" element={<VerifierDashboard />} />
                </Route>
              </Route>

              {/* ADMIN ROUTES */}
              <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
                  <Route path="/admin/users" element={<ManageUsers />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
