import { useState } from "react";
import { z } from "zod";
import { getQuotationItems, createQuotation } from "../../services/vendorQuotationService";
import RequisitionSelector from "../common/RequisitionSelector";
import VendorSelector from "../common/VendorSelector";
import { FaFileInvoiceDollar, FaUserTie, FaBoxOpen, FaClipboardList, FaCheckCircle, FaSearch, FaSave } from "react-icons/fa";
import AlertToast from "../ui/AlertToast";

const VendorQuotationDetails = () => {
  // State for the loaded context (header info)
  const [contextData, setContextData] = useState(null);
  // State for items (editable)
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  // Filters
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const handleSearch = async () => {
    // User flow: Select Requisition + Vendor -> GET /api/vendor-quotations/by_requisition_vendor
    if (!selectedRequisition || !selectedVendor) {
      setToast({ open: true, type: "error", message: "Please select both Requisition and Vendor to search" });
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setContextData(null);
    setItems([]);

    try {
      const reqId = selectedRequisition;
      const vendId = selectedVendor;

      // specific endpoint
      const data = await getQuotationItems(reqId, vendId);

      console.log("Loaded Quotation Details:", data);
      if (data) {
        setContextData(data);
        // Initialize items with editable state
        const rawItems = data.items || [];
        setItems(rawItems.map(item => ({
          ...item,
          quoted_rate: item.quoted_rate || "" // Pre-fill if exists, else empty
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

  const handleSubmit = async () => {
    if (!contextData) return;

    setSubmitting(true);

    // Prepare Payload
    const payload = {
      requisition: selectedRequisition,
      vendor: selectedVendor,
      items: items.map(item => ({
        vendor_item: item.vendor_item_id,
        quoted_rate: parseFloat(item.quoted_rate) || 0
      }))
    };

    // Zod Validation Schema
    const schema = z.object({
      items: z.array(z.object({
        vendor_item: z.any(),
        quoted_rate: z.number().gt(0, "Rate must be greater than 0")
      }))
    });

    try {
      // 1. Validate
      schema.parse(payload);

      // 2. Submit
      await createQuotation(payload);

      setToast({ open: true, type: "success", message: "Quotation submitted successfully!" });

      // Clear form after success
      setItems([]);
      setContextData(null);
      setHasSearched(false);
      setSelectedRequisition(null);
      setSelectedVendor(null);

    } catch (err) {
      if (err instanceof z.ZodError) {
        console.warn("Validation failed:", err.errors);
        setToast({ open: true, type: "error", message: "All items must have a valid quoted rate greater than 0.00" });
      } else {
        console.error(err);
        setToast({ open: true, type: "error", message: "Failed to submit quotation" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total for display
  const totalAmount = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.quoted_rate) || 0;
    return sum + (qty * rate);
  }, 0);

  return (
    <div className="space-y-6">

      {/* FILTERS CONTAINER */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full relative z-20">
            <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Select Requisition</label>
            <RequisitionSelector
              value={selectedRequisition}
              onChange={(id) => setSelectedRequisition(id)}
              placeholder="Search Requisition..."
            />
          </div>
          <div className="flex-1 w-full relative z-10">
            <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Select Vendor</label>
            <VendorSelector
              value={selectedVendor}
              onChange={(id) => setSelectedVendor(id)}
              placeholder="Search Vendor..."
            />
          </div>
          <div className="w-full md:w-auto">
            <button
              onClick={handleSearch}
              className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <FaSearch className="text-sm" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 animate-pulse bg-white rounded-xl border border-slate-200">
          Loading assigned items...
        </div>
      ) : !hasSearched ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
          <FaSearch className="mx-auto text-3xl mb-3 opacity-20" />
          <p>Select a Requisition and Vendor to start entry.</p>
        </div>
      ) : !contextData ? (
        // searched but no data found (or error caught)
        null
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">

          <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
            {/* Header Section */}
            <div className="p-5 border-b border-slate-300 bg-slate-50/30">
              <div className="flex flex-wrap justify-between gap-4 items-center">

                {/* Left: Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FaBoxOpen className="text-blue-600" />
                    <span className="font-bold text-slate-800 text-lg">
                      {contextData.requisition_number || "Requisition"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <FaUserTie className="text-slate-400" />
                      <span className="font-medium">{contextData.vendor_name || "Vendor"}</span>
                      <span className="text-xs bg-slate-200 px-1.5 rounded text-slate-600 font-mono">
                        {contextData.vendor_code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Total */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    <span className="text-sm text-slate-400 font-normal mr-2">Total Amount:</span>
                    {totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="p-5">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FaClipboardList /> Assigned Items ({items.length})
              </h4>
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300 text-sm uppercase">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right w-40">Quoted Rate</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-sm text-slate-800">
                    {items.map((item, idx) => (
                      <tr key={item.vendor_item_id || idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-base">{item.product_name}</div>
                          <div className="text-sm text-slate-500 font-mono">{item.product_code}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {item.quantity} <span className="text-sm text-slate-500">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full text-right px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={item.quoted_rate}
                            onChange={(e) => handleRateChange(idx, e.target.value)}
                            required
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {((parseFloat(item.quantity) || 0) * (parseFloat(item.quoted_rate) || 0)).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 italic max-w-37.5 truncate">
                          {/* Display only for now as requested payload didn't include updating remarks */}
                          {item.remarks || "-"}
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan="5" className="p-4 text-center text-slate-500">No items found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer / Submit */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-300 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting || items.length === 0}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'Saving...' : (
                  <>
                    <FaSave /> Submit Quotation
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

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
