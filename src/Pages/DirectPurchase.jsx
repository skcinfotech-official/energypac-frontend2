
import { useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";

const DirectPurchase = () => {
    const [searchText, setSearchText] = useState("");

    return (
        <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800">Direct Purchase</h3>
                        <span className="text-sm text-slate-500 font-semibold">
                            Total: 0
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500"
                        >
                            <FaPlus className="text-xs" />
                            New Direct Purchase
                        </button>
                    </div>
                </div>

                {/* SEARCH & FILTER */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Search */}
                        <div className="flex-1 min-w-55">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Search Direct Purchase
                            </label>
                            <div className="relative">
                                <input
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-slate-800 uppercase text-[10px] font-bold tracking-widest">
                                <th className="px-6 py-4 text-[13px]">ID</th>
                                <th className="px-6 py-4 text-[13px]">Date</th>
                                <th className="px-6 py-4 text-[13px]">Vendor</th>
                                <th className="px-6 py-4 text-[13px]">Amount</th>
                                <th className="px-6 py-4 text-[13px] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td colSpan="5" className="px-6 py-6 text-center text-slate-500">
                                    No data found
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION Placeholder */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                        disabled
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
                    >
                        ← Previous
                    </button>

                    <button
                        disabled
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DirectPurchase;
