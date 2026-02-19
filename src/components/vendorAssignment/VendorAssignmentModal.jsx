import { useEffect, useState } from "react";
import {
  createVendorAssignment,
  updateVendorAssignment,
  getVendorAssignment,
} from "../../services/vendorAssignment";
import { getRequisitionItems } from "../../services/requisition";
import VendorSelector from "../common/VendorSelector";
import RequisitionSelector from "../common/RequisitionSelector";
import { HiX, HiInformationCircle } from "react-icons/hi";

const VendorAssignmentModal = ({ open, onClose, editData, onSuccess, viewOnly = false }) => {
  const [form, setForm] = useState({
    requisition: "",
    vendor: "",
    remarks: "",
    items: [],
  });
  const [displayData, setDisplayData] = useState(null); // To hold rich data for defaultItems
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initData = async () => {
      setError("");

      if (editData) {
        // Init display data from props first to show something immediately
        setDisplayData(editData);

        // Always try to fetch fresh data if we have an ID
        if (editData.id) {
          setLoadingData(true);
          try {
            const { data } = await getVendorAssignment(editData.id);

            // Update display data for selectors
            setDisplayData(data);

            // Update form with fresh data
            setForm({
              requisition: data.requisition,
              vendor: data.vendor,
              remarks: data.remarks || "",
              items: data.items || [],
            });
          } catch (err) {
            console.error("Failed to fetch assignment details", err);
            // Fallback is already set via initial prop read if we want, 
            // but let's ensure form is set from props if it wasn't already (though we do it below)
          } finally {
            setLoadingData(false);
          }
        }

        // Ensure form is initialized from props at start (in case fetch is slow or fails)
        // This acts as the "optimistic" state
        setForm(() => {
          // If we already have fresh data (very fast), don't overwrite? 
          // actually this runs synchronously before the await above resolves in the same render cycle? 
          // No, await makes it async. So we set form here first.
          return {
            requisition: editData.requisition,
            vendor: editData.vendor,
            remarks: editData.remarks || "",
            items: editData.items || [],
          };
        });

      } else {
        setDisplayData(null);
        setForm({
          requisition: "",
          vendor: "",
          remarks: "",
          items: [],
        });
      }
    };

    if (open) {
      initData();
    }
  }, [editData, open]);

  if (!open) return null;

  const handleRequisitionChange = async (val) => {
    if (!val) {
      setForm({ ...form, requisition: "", items: [] });
      return;
    }

    try {
      const res = await getRequisitionItems(val);
      const items = res.data.items || res.data || [];

      setForm((prev) => ({
        ...prev,
        requisition: val,
        items: items,
      }));
    } catch (err) {
      console.error("Failed to fetch requisition items", err);
      setForm((prev) => ({ ...prev, requisition: val, items: [] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewOnly) return; // double check

    setError("");
    setSubmitting(true);

    const payload = {
      requisition: form.requisition,
      vendor: form.vendor,
      remarks: form.remarks,
      items: form.items.map((item) => ({
        requisition_item: item.requisition_item || item.id,
        quantity: Number(item.quantity),
      })),
    };

    try {
      if (editData) {
        await updateVendorAssignment(editData.id, payload);
      } else {
        await createVendorAssignment(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Construct default items for selectors from displayData
  const defaultRequisitionItem = displayData
    ? { id: displayData.requisition, requisition_number: displayData.requisition_number }
    : null;

  const defaultVendorItem = displayData && displayData.vendor_details
    ? {
      id: displayData.vendor,
      vendor_name: displayData.vendor_details.vendor_name,
      vendor_code: displayData.vendor_details.vendor_code
    }
    : null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-100 p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {viewOnly
                ? "View Assignment"
                : editData ? "Edit Vendor Assignment" : "Assign Vendor"}
            </h2>
            <p className="text-sm text-slate-500">
              {viewOnly
                ? "Viewing assignment details"
                : editData
                  ? "Update the vendor assignment details"
                  : "Create a new vendor assignment for a requisition"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-200"
          >
            <HiX size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
              <HiInformationCircle className="text-xl shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {loadingData && (
            <div className="text-center py-4 text-slate-500 text-sm">Loading details...</div>
          )}

          {!loadingData && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Requisition</label>
                <RequisitionSelector
                  value={form.requisition}
                  onChange={(val) => handleRequisitionChange(val)}
                  disabled={!!editData || viewOnly}
                  defaultItem={defaultRequisitionItem}
                  placeholder="Select a requisition..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Vendor</label>
                {!viewOnly ? (
                  <VendorSelector
                    value={form.vendor}
                    onChange={(val) => setForm({ ...form, vendor: val })}
                    defaultItem={defaultVendorItem}
                    placeholder="Select a vendor..."
                  />
                ) : (
                  <div className="pointer-events-none opacity-80">
                    <VendorSelector
                      value={form.vendor}
                      onChange={() => { }}
                      defaultItem={defaultVendorItem}
                      placeholder="Selected Vendor"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Remarks</label>
                <textarea
                  className="input min-h-20"
                  placeholder="Any internal notes or remarks..."
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  readOnly={viewOnly}
                  disabled={viewOnly}
                />
              </div>

              {/* Items Preview */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Item Preview</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-left">Unit</th>
                        <th className="px-4 py-3 text-left">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-slate-50/30">
                      {form.items.length > 0 ? (
                        form.items.map((i, idx) => (
                          <tr key={idx} className="hover:bg-white transition-colors">
                            <td className="px-4 py-2 font-medium text-slate-800">
                              {i.product_name || `Product ${i.product}`}
                            </td>
                            <td className="px-4 py-2 text-slate-600">{i.unit}</td>
                            <td className="px-4 py-2 text-slate-600">{i.quantity}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 py-8 text-center text-slate-400 italic">
                            No items loaded from requisition
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300"
            onClick={onClose}
          >
            {viewOnly ? "Close" : "Cancel"}
          </button>
          {!viewOnly && (
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg min-w-25"
              disabled={submitting || loadingData}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <span>{editData ? "Update Assignment" : "Assign Vendor"}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorAssignmentModal;
