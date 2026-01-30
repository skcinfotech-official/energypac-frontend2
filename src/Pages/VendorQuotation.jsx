import { useState } from "react";
import AssignedVendorsTab from "../components/vendorQuotation/VendorQuotationDetails";
import RequisitionFlowTab from "../components/vendorQuotation/RequisitionFlow";
import VendorQuotationList from "../components/vendorQuotation/VendorQuotationList";
import QuotationComparison from "../components/vendorQuotation/QuotationComparison";

export default function VendorQuotation() {
  const [activeTab, setActiveTab] = useState("assigned");

  const tabs = [
    { id: "assigned", label: "Quotation Submission" },
    { id: "list", label: "All Quotations" },
    { id: "flow", label: "Quotation Flow" },
    { id: "comparison", label: "Comparison" },
  ];

  return (
    <div className="">

      {/* HEADER */}
      {/* <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Vendor Quotations
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage vendor offers, compare rates, and select winning quotations.
          </p>
        </div>
      </div> */}

      {/* TABS HEADER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 px-1">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap outline-none
                ${activeTab === tab.id
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }
              `}
            >
              <span className="relative z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full mx-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "assigned" && (
          <AssignedVendorsTab />
        )}

        {activeTab === "list" && (
          <VendorQuotationList />
        )}

        {activeTab === "flow" && (
          <RequisitionFlowTab />
        )}

        {activeTab === "comparison" && (
          <QuotationComparison />
        )}
      </div>
    </div>
  );
}
