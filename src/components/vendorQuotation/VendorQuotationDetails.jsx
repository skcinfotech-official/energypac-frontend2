import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { getQuotationItems, createQuotation } from "../../services/vendorQuotationService";
import { getCurrencies } from "../../services/currencyService";
import RequisitionSelector from "../common/RequisitionSelector";
import VendorSelector from "../common/VendorSelector";
import { FaFileInvoiceDollar, FaUserTie, FaBoxOpen, FaClipboardList, FaSearch, FaSave, FaTimes, FaGlobe } from "react-icons/fa";
import AlertToast from "../ui/AlertToast";

const VendorQuotationDetails = ({ open, onClose, onSuccess }) => {
  const modalRef = useRef(null);
  
  // State for the loaded context (header info)
  const [contextData, setContextData] = useState(null);
  // State for items (editable)
  const [items, setItems] = useState([]);
  const [currency, setCurrency] = useState("INR");
  const [currencies, setCurrencies] = useState([]);

  // New Required Quotation Fields
  const [referenceNumber, setReferenceNumber] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  // Filters
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Load active currencies from database
  useEffect(() => {
    if (open) {
      getCurrencies({ isActive: true }).then((res) => {
        const results = res.data?.results || res.results || res.data || [];
        setCurrencies(results);
        if (results.length > 0) {
          // Default to INR or first active currency
          const inr = results.find((c) => c.code === "INR");
          setCurrency(inr ? "INR" : results[0].code);
        }
      }).catch((err) => {
        console.error("Failed to load currencies", err);
      });
    }
  }, [open]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setContextData(null);
      setItems([]);
      setHasSearched(false);
      setSelectedRequisition(null);
      setSelectedVendor(null);
      setReferenceNumber("");
      setValidityDate("");
      setPaymentTerms("");
      setDeliveryTerms("");
      setRemarks("");
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target.closest(".requisition-selector-portal") || e.target.closest(".vendor-selector-portal")) {
      return;
    }
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleSearch = async () => {
    if (!selectedRequisition || !selectedVendor) {
      setToast({ open: true, type: "error", message: "Please select both Requisition and Vendor to search" });
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setContextData(null);
    setItems([]);

    try {
      const data = await getQuotationItems(selectedRequisition, selectedVendor);

      console.log("Loaded Quotation Details:", data);
      if (data) {
        setContextData(data);
        const rawItems = data.items || [];
        setItems(rawItems.map(item => ({
          ...item,
          quoted_rate: item.quoted_rate || "" 
        })));
      }
    } catch (err) {
      console.error(err);
      setToast({ open: true, type: "error", message: "Failed to load quotation details" });
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (index, value) => {
    const newItems = [...items];
    newItems[index].quoted_rate = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!contextData) return;

    setSubmitting(true);

    // Prepare Payload exactly matching requirement
    const payload = {
      requisition: selectedRequisition,
      vendor: selectedVendor,
      currency: currency,
      reference_number: referenceNumber,
      validity_date: validityDate,
      payment_terms: paymentTerms || null,
      delivery_terms: deliveryTerms || null,
      remarks: remarks || null,
      items: items.map(item => ({
        vendor_item: item.vendor_item_id || item.vendor_item || item.id,
        quoted_rate: item.quoted_rate === "" ? 0 : parseFloat(item.quoted_rate)
      }))
    };

    // Zod Validation Schema
    const schema = z.object({
      requisition: z.string().uuid("Invalid Requisition"),
      vendor: z.string().uuid("Invalid Vendor"),
      currency: z.string().min(1, "Currency is required"),
      reference_number: z.string().min(1, "Reference Number is required"),
      validity_date: z.string().min(1, "Validity Date is required"),
      items: z.array(z.object({
        vendor_item: z.any(),
        quoted_rate: z.number().min(0, "Rate must be 0 or greater")
      }))
    });

    try {
      // 1. Validate
      schema.parse(payload);

      // 2. Submit
      await createQuotation(payload);

      onSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.warn("Validation failed:", err.errors);
        const firstError = err.errors[0]?.message || "Please check all required fields";
        setToast({ open: true, type: "error", message: firstError });
      } else {
        console.error("Submission Error:", err);
        let errorMsg = "Failed to submit quotation";

        if (err.response?.data) {
          const data = err.response.data;
          if (typeof data === "string") {
            errorMsg = data;
          } else if (data?.error) {
            errorMsg = data.error;
          } else if (data?.detail) {
            errorMsg = data.detail;
          } else if (data?.message) {
            errorMsg = data.message;
          } else if (typeof data === "object") {
            const firstKey = Object.keys(data)[0];
            if (firstKey) {
              const val = data[firstKey];
              errorMsg = Array.isArray(val) ? val[0] : val;
            }
          }
        }
        setToast({ open: true, type: "error", message: errorMsg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total in selected currency (No price conversion)
  const totalAmount = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.quoted_rate) || 0;
    return sum + (qty * rate);
  }, 0);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto transition-opacity"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <FaFileInvoiceDollar className="text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Create Vendor Quotation</h3>
              <p className="text-xs text-slate-500">Provide quotation details and item rates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SEARCH FILTERS */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-2 relative z-30">
                <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Select Requisition</label>
                <RequisitionSelector
                  value={selectedRequisition}
                  onChange={(id) => {
                    setSelectedRequisition(id);
                    setSelectedVendor(null);
                  }}
                  placeholder="Search Requisition..."
                />
              </div>
              <div className="md:col-span-2 relative z-20">
                <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Select Vendor</label>
                <VendorSelector
                  value={selectedVendor}
                  onChange={(id) => setSelectedVendor(id)}
                  requisitionId={selectedRequisition}
                  disabled={!selectedRequisition}
                  placeholder={selectedRequisition ? "Search Vendor..." : "Select Requisition First"}
                />
              </div>
              <div className="md:col-span-1">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                  <FaSearch className="text-xs" />
                  Search Items
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH RESULT SCREEN */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Loading items...</p>
            </div>
          ) : !hasSearched ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50/30 border-2 border-dashed border-slate-200 rounded-xl">
              <FaSearch className="mx-auto text-3xl mb-2 opacity-30 text-blue-500" />
              <p className="text-sm font-semibold">Select a Requisition and Vendor to retrieve assigned items.</p>
            </div>
          ) : !contextData ? (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
              No items could be loaded. Please check vendor assignments.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* QUOTATION HEADER FIELDS */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
                  <FaUserTie /> Quotation Details
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Reference Number *</label>
                    <input
                      className="input w-full"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. VENDOR-REF-123"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Validity Date *</label>
                    <input
                      type="date"
                      className="input w-full"
                      value={validityDate}
                      onChange={(e) => setValidityDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Currency *</label>
                    <select
                      className="input w-full bg-white"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      {currencies.map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.code} ({c.symbol})
                        </option>
                      ))}
                      {currencies.length === 0 && <option value="INR">INR (₹)</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Payment Terms</label>
                    <input
                      className="input w-full"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="e.g. 30 days"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Delivery Terms</label>
                    <input
                      className="input w-full"
                      value={deliveryTerms}
                      onChange={(e) => setDeliveryTerms(e.target.value)}
                      placeholder="e.g. Ex-works"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Remarks</label>
                  <textarea
                    className="input w-full"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Prices valid for 30 days"
                    rows={2}
                  />
                </div>
              </div>

              {/* ITEMS ENTRY */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FaClipboardList /> Quotation Items ({items.length})
                  </h4>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 mr-2">Quoted Total:</span>
                    <span className="text-lg font-black text-slate-800">
                      {currency} {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Product Description</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-right w-48">Quoted Rate ({currency}) *</th>
                        <th className="px-4 py-3 text-right">Amount ({currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={item.vendor_item_id || item.id || idx} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">{item.product_name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{item.product_code}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700">
                            {Number(item.quantity).toFixed(2)} <span className="text-xs text-slate-400">{item.unit}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              required
                              className="w-full text-right px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                              value={item.quoted_rate || ""}
                              onChange={(e) => handleRateChange(idx, e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                            {((parseFloat(item.quantity) || 0) * (parseFloat(item.quoted_rate) || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  <FaSave /> {submitting ? "Saving..." : "Submit Quotation"}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
      
      <AlertToast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
};

export default VendorQuotationDetails;
