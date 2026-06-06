import { FaTimes, FaFileInvoice, FaBoxOpen, FaTruck } from "react-icons/fa";

const REASON_LABELS = {
    DEFECTIVE: "Defective",
    WRONG_ITEM: "Wrong Item",
    EXCESS: "Excess Quantity",
    DAMAGED: "Damaged in Transit",
    QUALITY: "Quality Issue",
    OTHER: "Other",
};

const CONDITION_LABELS = {
    GOOD: "Good",
    DAMAGED: "Damaged",
    UNUSABLE: "Unusable",
};

const CONDITION_STYLES = {
    GOOD: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DAMAGED: "bg-amber-50 text-amber-700 border-amber-200",
    UNUSABLE: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_STYLES = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-rose-50 text-rose-600 border-rose-200",
};

const ReturnDetailsModal = ({ isOpen, onClose, returnData, type }) => {
    if (!isOpen || !returnData) return null;

    const isSales = type === "sales";
    const items = returnData.items || [];
    const noteNumber = isSales ? returnData.credit_note_number : returnData.debit_note_number;
    const noteLabel = isSales ? "Credit Note" : "Debit Note";
    const refNumber = isSales ? returnData.pi_number : returnData.po_number;
    const refLabel = isSales ? "Proforma Invoice" : "Purchase Order";
    const status = (returnData.status || "DRAFT").toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        {isSales ? <FaBoxOpen className="text-blue-600" size={20} /> : <FaTruck className="text-blue-600" size={20} />}
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">{isSales ? "Sales" : "Purchase"} Return Details</h2>
                            <p className="text-xs text-slate-400 font-mono font-bold">{returnData.return_number}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${STATUS_STYLES[status] || STATUS_STYLES.DRAFT}`}>{status}</span>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"><FaTimes size={16} /></button>
                    </div>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* INFO GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InfoCard label={refLabel} value={refNumber} mono />
                        <InfoCard label="Return Date" value={returnData.return_date} />
                        <InfoCard label="Currency" value={returnData.currency || "BDT"} />
                        <InfoCard label="Total Amount" value={
                            <span className="text-blue-700 font-black text-base">
                                {Number(returnData.total_return_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        } />
                    </div>

                    {/* NOTE INFO */}
                    {noteNumber && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <FaFileInvoice className="text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700">{noteLabel}:</span>
                            <span className="text-sm font-black font-mono text-emerald-800">{noteNumber}</span>
                        </div>
                    )}

                    {/* VENDOR (purchase returns) */}
                    {!isSales && returnData.vendor_name && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-xs font-bold text-slate-500">Vendor:</span>
                            <span className="ml-2 text-sm font-semibold text-slate-700">{returnData.vendor_name}</span>
                        </div>
                    )}

                    {/* REASON / NOTES */}
                    {(returnData.reason || returnData.notes) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {returnData.reason && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</div>
                                    <div className="text-sm text-slate-700 font-medium">{returnData.reason}</div>
                                </div>
                            )}
                            {returnData.notes && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</div>
                                    <div className="text-sm text-slate-700 font-medium">{returnData.notes}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ITEMS TABLE */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Return Items</h3>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-3 w-10">#</th>
                                        <th className="px-3 py-3">Product</th>
                                        <th className="px-3 py-3 w-20 text-right">Qty</th>
                                        <th className="px-3 py-3 w-24 text-right">Unit Price</th>
                                        <th className="px-3 py-3 w-24 text-right">Subtotal</th>
                                        <th className="px-3 py-3 w-28">Reason</th>
                                        <th className="px-3 py-3 w-24 text-center">Condition</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.length > 0 ? items.map((item, idx) => {
                                        const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                                        const condStyle = CONDITION_STYLES[item.condition] || CONDITION_STYLES.GOOD;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-3 font-semibold text-slate-400">{idx + 1}</td>
                                                <td className="px-3 py-3">
                                                    <div className="font-semibold text-slate-800">{item.product_name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{item.product_code}</div>
                                                </td>
                                                <td className="px-3 py-3 text-right font-bold text-slate-800">{item.quantity}</td>
                                                <td className="px-3 py-3 text-right font-medium text-slate-600 font-mono">{Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-3 text-right font-bold text-slate-800 font-mono">{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-3 text-xs font-medium text-slate-600">{REASON_LABELS[item.reason] || item.reason}</td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${condStyle}`}>
                                                        {CONDITION_LABELS[item.condition] || item.condition}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400 italic">No items</td></tr>
                                    )}
                                </tbody>
                                {items.length > 0 && (
                                    <tfoot className="bg-slate-50 border-t border-slate-200">
                                        <tr>
                                            <td colSpan="4" className="px-3 py-3 text-right font-bold text-slate-700 text-xs">TOTAL:</td>
                                            <td className="px-3 py-3 text-right font-black text-blue-700 text-sm font-mono">
                                                {Number(returnData.total_return_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td colSpan="2"></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                    {/* META */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] text-slate-400">
                        {returnData.created_by_name && <div><span className="font-bold uppercase">Created by:</span> {returnData.created_by_name}</div>}
                        {returnData.created_at && <div><span className="font-bold uppercase">Created:</span> {new Date(returnData.created_at).toLocaleDateString()}</div>}
                        {returnData.approved_by_name && <div><span className="font-bold uppercase">Approved by:</span> {returnData.approved_by_name}</div>}
                        {returnData.approved_at && <div><span className="font-bold uppercase">Approved:</span> {new Date(returnData.approved_at).toLocaleDateString()}</div>}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-sm">Close</button>
                </div>
            </div>
        </div>
    );
};

const InfoCard = ({ label, value, mono }) => (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
        <div className={`text-sm font-semibold text-slate-800 ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
);

export default ReturnDetailsModal;
