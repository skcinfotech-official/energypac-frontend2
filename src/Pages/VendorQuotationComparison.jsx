import { useState } from "react";
import RequisitionFlowTab from "../components/vendorQuotation/RequisitionFlow";
import QuotationComparison from "../components/vendorQuotation/QuotationComparison";
import { FaChartLine, FaExchangeAlt } from "react-icons/fa";

export default function VendorQuotationComparison() {
  const [activeTab, setActiveTab] = useState("comparison");

  const tabs = [
    { id: "comparison", label: "Quotation Comparison", icon: <FaExchangeAlt /> },
    { id: "flow", label: "Quotation Flow", icon: <FaChartLine /> },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FaChartLine className="text-blue-600" />
            Quotation Comparison & Flow
          </h3>
          <p className="text-xs text-slate-500 font-medium">Compare vendor quotes and track item requisition cycles</p>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-1">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2
                ${
                  activeTab === tab.id
                    ? "text-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }
              `}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 mx-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "comparison" && <QuotationComparison />}
        {activeTab === "flow" && <RequisitionFlowTab />}
      </div>
    </div>
  );
}
