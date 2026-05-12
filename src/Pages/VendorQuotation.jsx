import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AssignedVendorsTab from "../components/vendorQuotation/VendorQuotationDetails";
import RequisitionFlowTab from "../components/vendorQuotation/RequisitionFlow";
import VendorQuotationList from "../components/vendorQuotation/VendorQuotationList";
import QuotationComparison from "../components/vendorQuotation/QuotationComparison";

export default function VendorQuotation() {
  const [activeTab, setActiveTab] = useState("assigned");
  const [searchParams] = useSearchParams();

  // SOURCE OF TRUTH (no state, no effect)
  const viewId = searchParams.get("view_id");

  // Derived tab (pure calculation)
  const currentTab = viewId ? "list" : activeTab;

  const tabs = [
    { id: "assigned", label: "Create Quotation" },
    { id: "list", label: "All Quotations" },
    { id: "flow", label: "Quotation Flow" },
    { id: "comparison", label: "Comparison" },
  ];

  return (
    <div>
      {/* TABS HEADER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 px-1">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${
                  currentTab === tab.id
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }
              `}
            >
              <span>{tab.label}</span>
              {currentTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 mx-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {currentTab === "assigned" && <AssignedVendorsTab />}

        {currentTab === "list" && (
          <VendorQuotationList initialViewId={viewId} />
        )}

        {currentTab === "flow" && <RequisitionFlowTab />}

        {currentTab === "comparison" && <QuotationComparison />}
      </div>
    </div>
  );
}
