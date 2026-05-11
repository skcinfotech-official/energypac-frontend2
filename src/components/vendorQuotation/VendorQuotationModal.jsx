import { useEffect, useState } from "react";
import { getQuotationItems, createQuotation } from "../../services/vendorQuotationService";
import { exchangeRateService } from "../../services/exchangeRateService";
import { HiX, HiInformationCircle, HiRefresh } from "react-icons/hi";

const VendorQuotationModal = ({ open, onClose, onSuccess, requisitionId, vendorId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    if (open && requisitionId && vendorId) {
      loadItems();
    }
  }, [open, requisitionId, vendorId]);

  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getQuotationItems(requisitionId, vendorId);
      // data.items expected array
      const rawItems = data.items || [];
      setItems(
        rawItems.map((item) => ({
          ...item,
          quoted_rate: "", // default empty
        }))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load items for quotation.");
    } finally {
      setLoading(false);
    }
  };

  const loadExchangeRate = async () => {
    setRateLoading(true);
    try {
      const data = await exchangeRateService.getCurrentRate();
      setExchangeRate(data.rate);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch exchange rate. Using default 1.0.");
    } finally {
      setRateLoading(false);
    }
  };

  useEffect(() => {
    if (currency === "USD") {
      loadExchangeRate();
    } else {
      setExchangeRate(1.0);
    }
  }, [currency]);

  const handleRateChange = (index, val) => {
    const newItems = [...items];
    newItems[index].quoted_rate = val;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        requisition: requisitionId,
        vendor: vendorId,
        currency: currency,
        items: items.map((i) => ({
          vendor_item: i.id, // Assuming the API returns 'id' as 'vendor_item' reference
          quoted_rate: Number(i.quoted_rate || 0),
        })),
      };

      await createQuotation(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create quotation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmountOriginal = items.reduce(
    (sum, i) => sum + (Number(i.quoted_rate || 0) * Number(i.quantity || 0)),
    0
  );
  const totalAmountINR = currency === "USD" ? totalAmountOriginal * exchangeRate : totalAmountOriginal;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-100 p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Enter Quotation Rates</h2>
            <p className="text-sm text-slate-500">Provide rates for the assigned items</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-200"
          >
            <HiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Vendor Details Snippet */}
          {items.length > 0 && items[0].vendor_name && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap gap-6 items-start">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Vendor</span>
                <div className="font-bold text-slate-800">{items[0].vendor_name}</div>
                <div className="text-xs text-slate-500 font-mono">{items[0].vendor_code}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tax Info</span>
                <div className="flex gap-2 text-xs">
                  {items[0].gst_number && <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-blue-600">GST: {items[0].gst_number}</span>}
                  {items[0].pan_number && <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-600">PAN: {items[0].pan_number}</span>}
                </div>
              </div>
              {(items[0].bank_name || items[0].bank_account_number || items[0].account_number || items[0].account_name) && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Bank Details</span>
                  <div className="text-xs text-slate-600 leading-tight">
                    <div><span className="text-slate-400">Bank:</span> {items[0].bank_name || "-"}</div>
                    <div><span className="text-slate-400">Name:</span> {items[0].account_name || "-"}</div>
                    <div className="font-mono"><span className="text-slate-400">A/C:</span> {items[0].bank_account_number || items[0].account_number || "-"}</div>
                    <div><span className="text-slate-400">IFSC:</span> {items[0].ifsc_code || "-"}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Currency Selection */}
          <div className="flex items-center justify-between gap-12 bg-blue-50/50 border border-blue-100 p-3 rounded-xl">
            <div>
              <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1.5">Currency</label>
              <div className="flex gap-1.5">
                {["INR", "USD"].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      currency === curr
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {currency === "USD" && (
              <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Exchange Rate</p>
                  <p className="text-sm font-black text-blue-600 leading-none">1 USD = ₹ {Number(exchangeRate).toFixed(2)}</p>
                </div>
                <button 
                  type="button" 
                  onClick={loadExchangeRate} 
                  className="p-1.5 hover:bg-blue-50 rounded-md text-blue-400 transition-colors"
                >
                  <HiRefresh className={rateLoading ? "animate-spin" : ""} size={12} />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
              <HiInformationCircle className="text-xl shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading items...</div>
          ) : (
            <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Rate ({currency})</th>
                  <th className="px-4 py-3 text-right">Amount ({currency})</th>
                  {currency === "USD" && <th className="px-4 py-3 text-right">Amount (INR)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="odd:bg-slate-100 even:bg-white hover:bg-slate-200   ">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {item.product_name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {item.product_code}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {Number(item.quantity).toFixed(2)} <span className="text-xs text-slate-400">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        className="input w-32 text-right py-1 px-2 text-sm"
                        placeholder="0.00"
                        value={item.quoted_rate}
                        onChange={(e) => handleRateChange(idx, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {currency === "USD" ? "$" : "₹"} {(Number(item.quoted_rate || 0) * Number(item.quantity || 0)).toFixed(2)}
                    </td>
                    {currency === "USD" && (
                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                        ₹ {(Number(item.quoted_rate || 0) * Number(item.quantity || 0) * exchangeRate).toFixed(2)}
                      </td>
                    )}
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                      No assigned items found for this vendor/requisition.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-3">
          <div className="flex flex-col">
            <div className="text-lg font-bold text-slate-900">
              Total: {currency === "USD" ? "$" : "₹"} {totalAmountOriginal.toFixed(2)}
            </div>
            {currency === "USD" && (
              <div className="text-sm font-semibold text-blue-600">
                (Approx ₹ {totalAmountINR.toFixed(2)})
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary"
              disabled={submitting || loading || items.length === 0}
            >
              {submitting ? "Submitting..." : "Submit Quotation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorQuotationModal;
