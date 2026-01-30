import { useEffect, useState } from "react";
import { getQuotationItems, createQuotation } from "../../services/vendorQuotationService";
import { HiX, HiInformationCircle } from "react-icons/hi";

const VendorQuotationModal = ({ open, onClose, onSuccess, requisitionId, vendorId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const totalAmount = items.reduce(
    (sum, i) => sum + (Number(i.quoted_rate || 0) * Number(i.quantity || 0)),
    0
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
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
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {item.product_name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {item.product_code}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {item.quantity} <span className="text-xs text-slate-400">{item.unit}</span>
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
                      ₹ {(Number(item.quoted_rate || 0) * Number(item.quantity || 0)).toFixed(2)}
                    </td>
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

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-3">
          <div className="text-lg font-bold text-slate-900">
            Total: ₹ {totalAmount.toFixed(2)}
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
