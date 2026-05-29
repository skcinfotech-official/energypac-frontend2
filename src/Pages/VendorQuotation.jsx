import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import VendorQuotationList from "../components/vendorQuotation/VendorQuotationList";
import VendorQuotationDetails from "../components/vendorQuotation/VendorQuotationDetails";

export default function VendorQuotation() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listKey, setListKey] = useState(0);
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get("view_id");

  const handleQuotationSuccess = () => {
    // Increment listKey to force-remount and reload VendorQuotationList table
    setListKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* LIST TABLE */}
      <VendorQuotationList 
        key={listKey} 
        initialViewId={viewId} 
        onNewQuotation={() => setIsModalOpen(true)}
      />

      {/* CREATE MODAL */}
      <VendorQuotationDetails
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleQuotationSuccess}
      />
    </div>
  );
}
