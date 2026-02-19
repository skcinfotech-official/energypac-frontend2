import { useEffect, useState } from "react";
import {
  createRequisition,
  updateRequisition,
  getRequisition,
} from "../../services/requisition";
import ProductSelector from "../common/ProductSelector";
import { HiPlus, HiTrash, HiX, HiInformationCircle } from "react-icons/hi";

const emptyItem = {
  product: "",
  quantity: "",
  remarks: "",
  unit: "",
};


const RequisitionModal = ({ open, onClose, editData, onSuccess, viewOnly = false }) => {
  const [form, setForm] = useState({
    requisition_date: new Date().toISOString().split("T")[0],
    remarks: "",
    items: [{ ...emptyItem }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isAssigned, setIsAssigned] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if ((viewOnly || editData) && editData?.id) {
        try {
          const { data } = await getRequisition(editData.id);

          const reqDate = data.requisition_date;
          const remarks = data.remarks || "";

          if (data.is_assigned !== undefined) {
            setIsAssigned(data.is_assigned);
          }

          let items = [];
          if (data.items && Array.isArray(data.items)) {
            items = data.items.map((i) => ({
              product: i.product,
              product_name: i.product_name || i.product_details?.item_name,
              product_code: i.product_code || i.product_details?.item_code,
              unit: i.unit || i.product_details?.unit || "UNIT",
              quantity: i.quantity,
              remarks: i.remarks || "",
            }));
          } else if (editData.items) {
            items = [...editData.items];
          }

          setForm({
            requisition_date: reqDate,
            remarks: remarks,
            items: items.length ? items : [{ ...emptyItem }],
          });
        } catch (error) {
          console.error("Failed to fetch details", error);
        }
      } else if (editData) {
        // Fallback if no ID available or logic requires it
        setForm({
          requisition_date: editData.requisition_date,
          remarks: editData.remarks || "",
          items:
            editData.items?.map((i) => ({
              product: i.product,
              product_name: i.product_name,
              quantity: i.quantity,
              remarks: i.remarks || "",
              unit: i.unit || i.product_details?.unit || "",
            })) || [{ ...emptyItem }],
        });
        setIsAssigned(editData.is_assigned || false);
      }
    };

    if (editData && editData.id) {
      // While fetching, we can show existing data to avoid flicker logic is tricky
      // Let's just run fetchData which handles it. 
      // But strictly, we should probably set initial state from props first?
      // The original code did set initial state then fetch.
      // Let's do the same for smoother UX.
      setForm({
        requisition_date: editData.requisition_date,
        remarks: editData.remarks || "",
        items:
          editData.items?.map((i) => ({
            product: i.product,
            quantity: i.quantity,
            remarks: i.remarks || "",
            unit: i.unit || i.product_details?.unit || "",
          })) || [{ ...emptyItem }],
      });
      setIsAssigned(editData.is_assigned || false);
      fetchData();
    } else if (editData) {
      // Only props
      setForm({
        requisition_date: editData.requisition_date,
        remarks: editData.remarks || "",
        items:
          editData.items?.map((i) => ({
            product: i.product,
            quantity: i.quantity,
            remarks: i.remarks || "",
            unit: i.unit || i.product_details?.unit || "",
          })) || [{ ...emptyItem }],
      });
      setIsAssigned(editData.is_assigned || false);
    } else {
      setForm({
        requisition_date: new Date().toISOString().split("T")[0],
        remarks: "",
        items: [{ ...emptyItem }],
      });
      setIsAssigned(false);
    }
  }, [editData, open, viewOnly]);


  if (!open) return null;

  const updateItem = (index, updates) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      ),
    }));
  };


  const addItem = () => {
    setForm({ ...form, items: [{ ...emptyItem }, ...form.items] });
  };

  const removeItem = (index) => {
    const items = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: items.length ? items : [{ ...emptyItem }] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (form.items.some(item => !item.product || !item.quantity)) {
      setError("Please select a product and specify quantity for all items.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        requisition_date: form.requisition_date,
        remarks: form.remarks,
        items: form.items.map(item => ({
          product_id: item.product, // Try product_id
          product: item.product,    // Keep product just in case
          quantity: Number(item.quantity),
          remarks: item.remarks || ""
        })),
      };

      if (editData) {
        await updateRequisition(editData.id, payload);
      } else {
        await createRequisition(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      // Show more detailed error if available
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message;
      setError(`Error: ${detail}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0  bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-100 p-4 animate-in fade-in duration-300"
    // Backdrop click should NOT close modal per user request
    >
      <div
        className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editData ? "Edit Requisition" : "New Requisition"}
            </h2>
            <p className="text-sm text-slate-500">
              {viewOnly
                ? `Viewing details of ${editData?.requisition_number}`
                : editData
                  ? `Editing ${editData.requisition_number}`
                  : "Fill in the details to create a new request"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAssigned && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200 uppercase tracking-wide">
                Assigned
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-200"
            >
              <HiX size={20} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
              <HiInformationCircle className="text-xl shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* MASTER DATA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Requisition Date</label>
              <input
                type="date"
                className="input"
                value={form.requisition_date}
                onChange={(e) =>
                  setForm({ ...form, requisition_date: e.target.value })
                }
                readOnly={viewOnly}
                disabled={viewOnly}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Remarks</label>
              <input
                className="input"
                placeholder="Internal notes or comments..."
                value={form.remarks}
                onChange={(e) =>
                  setForm({ ...form, remarks: e.target.value })
                }
                readOnly={viewOnly}
                disabled={viewOnly}
              />
            </div>
          </div>

          {/* ITEMS LIST */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Item Details</h3>
              {!viewOnly && (
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg transition-colors border border-blue-100"
                >
                  <HiPlus /> Add Item
                </button>
              )}
            </div>

            <div className="space-y-3">
              {form.items.map((item, i) => (
                <div
                  key={i}
                  style={{ zIndex: form.items.length - i }}
                  className="group bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-start relative transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm overflow-visible"
                >
                  {/* Item Number */}
                  <div className="flex-none w-5  text-slate-900 self-center md:self-start pt-7 text-center text-sm">
                    {form.items.length - i}
                  </div>

                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Product</label>
                    <div className={viewOnly ? "pointer-events-none opacity-90" : ""}>
                      <ProductSelector
                        value={item.product}
                        defaultItem={item.product_name ? { item_name: item.product_name, item_code: item.product_code, id: item.product } : null}
                        onChange={(val, productObj) => {
                          if (productObj) {
                            updateItem(i, {
                              product: val,
                              unit: productObj.unit || "PCS",
                              product_name: productObj.item_name,
                              product_code: productObj.item_code
                            });
                          } else {
                            updateItem(i, { product: val });
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Unit Column - Dedicated */}
                  <div className="w-24 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Unit</label>
                    <div className="h-10.5 px-3 flex items-center bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">
                      {item.unit || "UNIT"}
                    </div>
                  </div>

                  <div className="w-24 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Qty</label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      placeholder="0"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, { quantity: e.target.value })}
                      required
                      readOnly={viewOnly}
                      disabled={viewOnly}
                    />
                  </div>

                  <div className="w-full md:w-48 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Remark</label>
                    <input
                      className="input"
                      placeholder="Notes..."
                      value={item.remarks}
                      onChange={(e) =>
                        updateItem(i, { remarks: e.target.value })
                      }
                      readOnly={viewOnly}
                      disabled={viewOnly}
                    />
                  </div>

                  {!viewOnly && (
                    <div className="self-end md:self-center pb-1 md:pb-0 mt-4 md:mt-2">
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                        title="Remove Item"
                      >
                        <HiTrash size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200  flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300"
            disabled={submitting}
          >
            {viewOnly ? "Close" : "Cancel"}
          </button>
          {!viewOnly && (
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg min-w-30  "
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <span>{editData ? "Update Changes" : "Create Requisition"}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequisitionModal;
