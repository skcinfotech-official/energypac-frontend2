import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getProformaInvoices, getProformaInvoiceById, createBill } from "../services/salesService";
import { FaFileInvoiceDollar, FaSearch, FaChevronDown, FaTimes, FaCalendarAlt, FaUserTie, FaEnvelope, FaPhone, FaMapMarkerAlt, FaPercent, FaCoins, FaRegCommentDots, FaBoxes, FaTrash, FaPlus, FaCheck, FaInfoCircle } from "react-icons/fa";
import AlertToast from "../components/ui/AlertToast";

const CreateBill = () => {
    const navigate = useNavigate();
    
    // Page Status
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    
    // PI Selection dropdown states
    const [piList, setPiList] = useState([]);
    const [piSearch, setPiSearch] = useState("");
    const [isPiDropdownOpen, setIsPiDropdownOpen] = useState(false);
    const [selectedPi, setSelectedPi] = useState(null);
    const [piListLoading, setPiListLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Form data state
    const [formData, setFormData] = useState({
        proforma_invoice: "",
        bill_date: new Date().toISOString().split('T')[0],
        bill_type: "DOMESTIC",
        client_name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        cgst_percentage: 0,
        sgst_percentage: 0,
        igst_percentage: 18,
        discount_amount: 0,
        remarks: "",
        items: []
    });

    // Handle clicking outside PI dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsPiDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch PI list when dropdown is opened or search text changes
    useEffect(() => {
        if (!isPiDropdownOpen) return;
        
        const fetchPIs = async () => {
            setPiListLoading(true);
            try {
                const response = await getProformaInvoices(1, piSearch);
                // Filter accepted or sent invoices to make billing cleaner
                const results = response.results || [];
                setPiList(results);
            } catch (err) {
                console.error("Failed to fetch PIs for dropdown", err);
            } finally {
                setPiListLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchPIs();
        }, 300);

        return () => clearTimeout(timer);
    }, [piSearch, isPiDropdownOpen]);

    // Handle selection of a Proforma Invoice
    const handlePiSelect = async (pi) => {
        setSelectedPi(pi);
        setIsPiDropdownOpen(false);
        setPiSearch("");
        setLoading(true);

        try {
            const details = await getProformaInvoiceById(pi.id);
            if (details) {
                // Determine default bill type from currency
                const isInternational = details.currency && details.currency !== "INR";
                const defaultBillType = isInternational ? "INTERNATIONAL" : "DOMESTIC";
                const defaultIgst = isInternational ? 18 : 0;
                
                // Map items
                const mappedItems = (details.items || []).map(item => ({
                    pi_item: item.id || null,
                    product: item.product || null,
                    item_name: item.product_name || item.item_name || "Product Item",
                    hsn_code: item.hsn_code || "",
                    unit: item.unit || "KG",
                    quantity: Number(item.quantity) || 0,
                    rate: Number(item.unit_price || item.rate) || 0
                }));

                setFormData(prev => ({
                    ...prev,
                    proforma_invoice: details.id,
                    bill_type: defaultBillType,
                    client_name: details.applicant_importer || "",
                    contact_person: details.consignee ? details.consignee.split("\n")[0] : "",
                    phone: details.phone || "",
                    email: details.email || "",
                    address: details.consignee || details.applicant_importer || "",
                    cgst_percentage: 0,
                    sgst_percentage: 0,
                    igst_percentage: defaultIgst,
                    discount_amount: 0,
                    remarks: `Against PI ${details.pi_number || details.id}`,
                    items: mappedItems
                }));

                setAlert({
                    open: true,
                    type: "success",
                    message: `Successfully loaded PI details: ${details.pi_number}`
                });
            }
        } catch (err) {
            console.error("Failed to load selected PI details", err);
            setAlert({
                open: true,
                type: "error",
                message: "Failed to load proforma invoice details."
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate real-time summary financials
    const calculateFinancials = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
        
        const cgst = subtotal * (Number(formData.cgst_percentage || 0) / 100);
        const sgst = subtotal * (Number(formData.sgst_percentage || 0) / 100);
        const igst = subtotal * (Number(formData.igst_percentage || 0) / 100);
        const totalTax = cgst + sgst + igst;
        
        const discount = Number(formData.discount_amount || 0);
        const netPayable = Math.max(0, subtotal + totalTax - discount);
        
        return {
            subtotal,
            cgst,
            sgst,
            igst,
            totalTax,
            netPayable
        };
    };

    const financials = calculateFinancials();

    // Handle form input fields change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.endsWith("_percentage") || name === "discount_amount" 
                ? (parseFloat(value) || 0) 
                : value
        }));
    };

    // Handle inline change for a specific item in the table
    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const updatedItems = [...prev.items];
            updatedItems[index] = {
                ...updatedItems[index],
                [field]: field === "quantity" || field === "rate" ? (parseFloat(value) || 0) : value
            };
            return {
                ...prev,
                items: updatedItems
            };
        });
    };

    // Remove an item from the bill item list
    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };



    // Form submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.proforma_invoice) {
            setAlert({ open: true, type: "error", message: "Please select a Proforma Invoice first." });
            return;
        }

        if (!formData.client_name?.trim()) {
            setAlert({ open: true, type: "error", message: "Client Name is required." });
            return;
        }

        if (!formData.bill_date) {
            setAlert({ open: true, type: "error", message: "Bill Date is required." });
            return;
        }

        if (formData.items.length === 0) {
            setAlert({ open: true, type: "error", message: "The bill must contain at least one item." });
            return;
        }

        const invalidItem = formData.items.find(item => !item.item_name || item.quantity <= 0 || item.rate <= 0);
        if (invalidItem) {
            setAlert({ open: true, type: "error", message: "All items must have a name, quantity > 0 and rate > 0." });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                cgst_percentage: Number(formData.cgst_percentage),
                sgst_percentage: Number(formData.sgst_percentage),
                igst_percentage: Number(formData.igst_percentage),
                discount_amount: Number(formData.discount_amount),
                items: formData.items.map(item => ({
                    ...item,
                    quantity: Number(item.quantity),
                    rate: Number(item.rate)
                }))
            };

            await createBill(payload);
            setAlert({ open: true, type: "success", message: "Bill generated successfully!" });
            
            // Redirect to PI Bills List after a short delay
            setTimeout(() => {
                navigate("/finance/pi-bills");
            }, 1500);

        } catch (err) {
            console.error("Failed to create bill", err);
            const errMsg = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || "Failed to create PI Bill.";
            setAlert({ open: true, type: "error", message: errMsg });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 py-2 px-1">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <FaFileInvoiceDollar className="text-blue-600" />
                        Create PI Bill
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Issue bills against existing proforma invoices. Fields and item lists are pre-populated automatically.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* PI SELECTION & CORE PROPERTIES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    {/* SEARCH/SELECT PROFORMA INVOICE */}
                    <div className="relative" ref={dropdownRef}>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-0.5">
                            Select Proforma Invoice *
                        </label>
                        <div 
                            onClick={() => setIsPiDropdownOpen(!isPiDropdownOpen)}
                            className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors min-h-[44px]"
                        >
                            <span className={selectedPi ? "text-slate-800 font-bold" : "text-slate-400 font-semibold"}>
                                {selectedPi ? `${selectedPi.pi_number} (${selectedPi.applicant_importer})` : "Select an active PI..."}
                            </span>
                            <FaChevronDown className={`text-slate-400 transition-transform ${isPiDropdownOpen ? "rotate-180" : ""}`} size={12} />
                        </div>

                        {isPiDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="p-2.5 border-b border-slate-100 bg-slate-50">
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by PI ref or client..."
                                            value={piSearch}
                                            onChange={(e) => setPiSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 py-1">
                                    {piListLoading ? (
                                        <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div>
                                            Loading proforma invoices...
                                        </div>
                                    ) : piList.length > 0 ? (
                                        piList.map((pi) => (
                                            <div
                                                key={pi.id}
                                                onClick={() => handlePiSelect(pi)}
                                                className="px-4 py-3 hover:bg-blue-50/50 cursor-pointer transition-colors text-sm"
                                            >
                                                <div className="font-bold text-slate-800 font-mono">{pi.pi_number || `#${pi.id.substring(0,8)}`}</div>
                                                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                                    <span className="font-medium">{pi.applicant_importer}</span>
                                                    <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{pi.currency} {Number(pi.grand_total).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-xs text-slate-400 italic">No matching proforma invoices found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BILL DATE */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-0.5">
                            Bill Date *
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                name="bill_date"
                                value={formData.bill_date}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                            <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    {/* BILL TYPE */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-0.5">
                            Bill Type *
                        </label>
                        <select
                            name="bill_type"
                            value={formData.bill_type}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            required
                        >
                            <option value="DOMESTIC">DOMESTIC</option>
                            <option value="INTERNATIONAL">INTERNATIONAL</option>
                        </select>
                    </div>
                </div>

                {/* CLIENT INFORMATION */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                        <FaUserTie className="text-slate-400" />
                        Client / Customer Contact details
                    </h3>
                    
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mb-2"></div>
                            <span className="text-xs font-semibold">Loading data from PI...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                    Client Name *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="client_name"
                                        value={formData.client_name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. ABC Trading LLC"
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        required
                                    />
                                    <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                    Contact Person
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleInputChange}
                                        placeholder="e.g. John"
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                    <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. +971-555-1234"
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="e.g. john@abc.com"
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                </div>
                            </div>

                            <div className="md:col-span-2 lg:col-span-4">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                    Billing Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="e.g.  New York, USA"
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                    <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ITEMS SECTION */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <FaBoxes className="text-slate-400" />
                            Bill Items
                        </h3>
                    </div>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                            <span className="font-semibold text-sm">Building item list from proforma invoice...</span>
                        </div>
                    ) : (
                        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 w-12 text-center">#</th>
                                        <th className="px-4 py-3">Item Name / Product Details *</th>
                                        <th className="px-4 py-3 w-32 text-center">HSN Code</th>
                                        <th className="px-4 py-3 w-28 text-center">Unit</th>
                                        <th className="px-4 py-3 w-28 text-right">Quantity *</th>
                                        <th className="px-4 py-3 w-36 text-right">Rate *</th>
                                        <th className="px-4 py-3 w-36 text-right">Total Amount</th>
                                        <th className="px-4 py-3 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {formData.items.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-12 text-center text-slate-400 italic">
                                                No items listed. Choose a Proforma Invoice to load items automatically.
                                            </td>
                                        </tr>
                                    ) : (
                                        formData.items.map((item, index) => (
                                            <tr key={index} className="hover:bg-slate-50 transition-colors align-middle">
                                                <td className="px-4 py-3 text-center font-semibold text-slate-400">{index + 1}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={item.item_name}
                                                        onChange={(e) => handleItemChange(index, "item_name", e.target.value)}
                                                        placeholder="Item description"
                                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                                                        required
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={item.hsn_code}
                                                        onChange={(e) => handleItemChange(index, "hsn_code", e.target.value)}
                                                        placeholder="HSN Code"
                                                        className="w-full text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={item.unit}
                                                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                                                        placeholder="e.g. KG, MTR"
                                                        className="w-full text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                        className="w-24 text-right px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                                                        min="0.01"
                                                        step="any"
                                                        required
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.rate}
                                                        onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                                                        className="w-28 text-right px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                                                        min="0.01"
                                                        step="any"
                                                        required
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono">
                                                    {Number(item.quantity * item.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-red-400 hover:text-red-600 transition-colors p-1.5"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* BOTTOM BLOCK: REMARKS & TAXES SUMMARY */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* REMARKS AND ADDITIONAL FIELDS */}
                    <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                            <FaRegCommentDots className="text-slate-400" />
                            Remarks & Details
                        </h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-0.5">
                                Remarks
                            </label>
                            <textarea
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleInputChange}
                                rows="4"
                                placeholder="Write any specific annotations or reference points..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-blue-700 flex items-start gap-2.5 leading-relaxed">
                            <FaInfoCircle className="mt-0.5 shrink-0" size={14} />
                            <div>
                                <span className="font-bold">Pro-Tip:</span> Generating a bill records it permanently in the Finance Ledger. Please make sure that all items loaded from the Proforma Invoice correspond exactly to the delivery parameters.
                            </div>
                        </div>
                    </div>

                    {/* FINANCIALS, TAXES AND GRAND TOTAL */}
                    <div className="w-full lg:w-[420px] bg-slate-50 text-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                                <FaCoins className="text-blue-500" />
                                Financial Summary
                            </h3>

                            <div className="space-y-3.5 mt-5">
                                <div className="flex justify-between text-s text-slate-600 font-semibold">
                                    <span>Items Subtotal</span>
                                    <span className="font-mono text-slate-900 font-bold">₹{financials.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>

                                {/* TAX INPUT FIELDS */}
                                <div className="border-t border-b border-slate-200 py-3.5 space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                                            CGST (%)
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                name="cgst_percentage"
                                                value={formData.cgst_percentage}
                                                onChange={handleInputChange}
                                                className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="text-slate-500 font-bold text-xs">%</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                                            SGST (%)
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                name="sgst_percentage"
                                                value={formData.sgst_percentage}
                                                onChange={handleInputChange}
                                                className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="text-slate-500 font-bold text-xs">%</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                                            IGST (%)
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                name="igst_percentage"
                                                value={formData.igst_percentage}
                                                onChange={handleInputChange}
                                                className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="text-slate-500 font-bold text-xs">%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* DISCOUNT AMOUNT INPUT */}
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs text-slate-600 font-semibold">Discount Amount</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-slate-500 font-bold text-sm">₹</span>
                                        <input
                                            type="number"
                                            name="discount_amount"
                                            value={formData.discount_amount}
                                            onChange={handleInputChange}
                                            className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            min="0"
                                            step="any"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between text-xs text-slate-500 font-semibold">
                                    <span>Total Taxation Value</span>
                                    <span className="font-mono text-slate-700">₹{financials.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* GRAND TOTAL & SUBMIT BUTTON */}
                        <div className="space-y-4 pt-6 border-t border-slate-200">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-inner">
                                <span className="text-sm font-bold text-slate-700">Grand Total Net Payable</span>
                                <span className="font-mono font-black text-2xl text-blue-600">₹{financials.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || loading}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <FaCheck size={12} />
                                {submitting ? "RECORDING BILL..." : "GENERATE PI BILL"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* ALERT TOAST */}
            <AlertToast
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />
        </div>
    );
};

export default CreateBill;
