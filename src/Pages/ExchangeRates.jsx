import { useState, useEffect } from "react";
import { exchangeRateService } from "../services/exchangeRateService";
import { 
  HiPlus, 
  HiTrash, 
  HiPencil, 
  HiCheckCircle, 
  HiXCircle, 
  HiRefresh, 
  HiClock,
  HiX,
  HiCurrencyDollar,
  HiExclamation
} from "react-icons/hi";
import { FaTrashAlt, FaEdit, FaSync } from "react-icons/fa";
import { toast } from "react-hot-toast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AlertToast from "../components/ui/AlertToast";

export default function ExchangeRates() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, rate: null, loading: false });
  const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
  const [formData, setFormData] = useState({
    rate: "",
    effective_date: new Date().toISOString().split("T")[0],
    is_active: true,
    remarks: "",
  });

  useEffect(() => {
    fetchRates();
  }, []);

  const showAlert = (message, type = "success") => {
    setAlert({ open: true, message, type });
  };

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await exchangeRateService.getAllRates();
      setRates(data.results || []);
    } catch (error) {
      toast.error("Failed to fetch exchange rates");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRate) {
        await exchangeRateService.updateRate(editingRate.id, formData);
        showAlert("Exchange rate updated successfully");
      } else {
        await exchangeRateService.createRate(formData);
        showAlert("New exchange rate added successfully");
      }
      setShowModal(false);
      setEditingRate(null);
      resetForm();
      fetchRates();
    } catch (error) {
      showAlert(error.response?.data?.error || "Failed to save exchange rate", "error");
    }
  };

  const handleDelete = (rate) => {
    if (rate.is_active) {
      showAlert("Cannot delete the active exchange rate. Deactivate it first.", "error");
      return;
    }
    setDeleteConfirm({ open: true, rate, loading: false });
  };

  const confirmDelete = async () => {
    const { rate } = deleteConfirm;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      await exchangeRateService.deleteRate(rate.id);
      showAlert("Exchange rate purged from system");
      setDeleteConfirm({ open: false, rate: null, loading: false });
      fetchRates();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to delete record";
      showAlert(errorMsg, "error");
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const openEditModal = (rate) => {
    setEditingRate(rate);
    setFormData({
      rate: rate.rate,
      effective_date: rate.effective_date,
      is_active: rate.is_active,
      remarks: rate.remarks || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      rate: "",
      effective_date: new Date().toISOString().split("T")[0],
      is_active: true,
      remarks: "",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Exchange Rates</h2>
          <p className="text-slate-500 font-medium">Manage system-wide USD to INR conversion rates for quotations and orders.</p>
        </div>

        <button 
          onClick={() => {
            resetForm();
            setEditingRate(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all font-semibold"
        >
          <HiPlus className="text-lg" />
          <span>Add New Rate</span>
        </button>
      </div>

      {/* RATES TABLE */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Effective Date</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Conversion Rate</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Updated By</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Syncing Data...</p>
                    </div>
                  </td>
                </tr>
              ) : rates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-400 italic font-medium">
                    No exchange rates found in the vault.
                  </td>
                </tr>
              ) : (
                rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
                          <HiClock size={20} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-sm">{new Date(rate.effective_date).toLocaleDateString()}</p>
                          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tight">Deployment Date</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                         <span className="text-lg font-black text-slate-900 tracking-tighter">₹ {parseFloat(rate.rate).toFixed(2)}</span>
                         <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold border border-indigo-100">USD/INR</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {rate.is_active ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-xs font-bold text-emerald-600 uppercase tracking-tight">Active Rate</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 opacity-50">
                          <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Historical</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                        <p className="font-bold text-slate-800">{rate.updated_by_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(rate)}
                          className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-all"
                          title="Edit Configuration"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(rate)}
                          className={`p-2 rounded-xl transition-all ${
                            rate.is_active 
                              ? "text-slate-300 cursor-not-allowed" 
                              : "text-red-400 hover:text-white hover:bg-red-600/20"
                          }`}
                          title={rate.is_active ? "Active rates cannot be deleted" : "Purge Record"}
                          disabled={rate.is_active}
                        >
                          <FaTrashAlt size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* MODAL HEADER */}
            <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                  <HiCurrencyDollar className="text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{editingRate ? "Update Exchange Rate" : "New Rate Entry"}</h3>
                  <p className="text-slate-500 text-xs uppercase tracking-widest mt-0.5">{editingRate ? "Modify Configuration" : "System Rate Initialization"}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <HiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">Rate (1 USD to INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 outline-none transition-all font-bold"
                      placeholder="83.5000"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">Effective Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 outline-none transition-all font-bold"
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">Active Status</p>
                  <p className="text-[10px] text-slate-400 font-medium">Toggle this to make it the primary system rate</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input 
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">Internal Remarks</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 outline-none transition-all min-h-[100px] resize-none"
                  placeholder="Reference or notes..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-2xl text-slate-400 font-bold hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20 transition-all font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                  {editingRate ? <FaEdit /> : <HiPlus />}
                  {editingRate ? "Update Rate" : "Deploy Rate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modals & Dialogs */}
      <ConfirmDialog 
        open={deleteConfirm.open}
        loading={deleteConfirm.loading}
        title="Purge Exchange Rate"
        message={`Are you sure you want to permanently delete the rate of ₹${parseFloat(deleteConfirm.rate?.rate || 0).toFixed(2)} effective from ${deleteConfirm.rate ? new Date(deleteConfirm.rate.effective_date).toLocaleDateString() : ''}? This action cannot be undone.`}
        confirmText="Purge Record"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, rate: null, loading: false })}
        icon={HiExclamation}
      />

      <AlertToast 
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
