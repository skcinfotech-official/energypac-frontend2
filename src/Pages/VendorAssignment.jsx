import { useEffect, useState } from "react";
import { getVendorAssignments } from "../services/vendorAssignment";
import VendorAssignmentModal from "../components/vendorAssignment/VendorAssignmentModal";
import { FaPlus, FaEdit, FaEye } from "react-icons/fa";
import AlertToast from "../components/ui/AlertToast";

const VendorAssignment = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [page, setPage] = useState(1);

  // Filter State
  const [searchText, setSearchText] = useState("");

  /* =========================
     MODAL STATE
     ========================= */
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);

  /* =========================
     TOAST
     ========================= */
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const loadData = async (pageNum = 1) => {
    setLoading(true);
    try {
      // Pass empty string for search text as requested ("only one search (vendor search)")
      const res = await getVendorAssignments(pageNum, searchText);
      const resData = res.data;

      if (resData.results) {
        setData(resData.results);
        setCount(resData.count || resData.results.length);
        setNext(resData.next);
        setPrevious(resData.previous);
      } else {
        setData(Array.isArray(resData) ? resData : []);
        setCount(Array.isArray(resData) ? resData.length : 0);
      }
      setPage(pageNum);
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        type: "error",
        message: "Failed to load vendor assignments",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (row) => {
    setEditData(row);
    setViewOnly(false);
    setOpenModal(true);
  };

  const handleView = (row) => {
    setEditData(row);
    setViewOnly(true);
    setOpenModal(true);
  };

  const handleAdd = () => {
    setEditData(null);
    setViewOnly(false);
    setOpenModal(true);
  };

  const handleSuccess = () => {
    setToast({
      open: true,
      type: "success",
      message: editData
        ? "Assignment updated successfully"
        : "Assignment created successfully",
    });
    loadData(page);
  };

  return (
    <div>
      {/* ALERT TOAST */}
      <AlertToast
        isOpen={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Vendor Assignments</h3>
            <span className="text-sm text-slate-500 font-semibold">
              Total: {count}
            </span>
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500"
          >
            <FaPlus className="text-xs" />
            Assign Vendor
          </button>
        </div>

        {/* SEARCH & FILTER */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search Input */}
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Search Assignment
              </label>
              <input
                type="text"
                placeholder="Search by req no, customized vendor search..."
                className="input"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            {/* Placeholder for alignment if needed */}
            <div className="w-1"></div>

            {/* Search Button */}
            <div className="w-32">
              <label className="block text-xs font-semibold text-transparent mb-1">
                Action
              </label>
              <button
                onClick={() => loadData(1)}
                className="w-full px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/50 text-slate-800 uppercase text-[10px] font-bold tracking-widest">
                <th className="px-6 py-4 text-[13px]">Requisition</th>
                <th className="px-6 py-4 text-[13px]">Vendor</th>
                <th className="px-6 py-4 text-[13px]">Assigned By</th>
                <th className="px-6 py-4 text-[13px] text-center">Items</th>
                <th className="px-6 py-4 text-[13px]">Date</th>
                <th className="px-6 py-4 text-[13px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-6 text-center text-slate-500"
                  >
                    Loading assignments...
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-blue-600 font-semibold">
                        {row.requisition_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {row.vendor_details?.vendor_name || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.assigned_by_name || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-slate-100 rounded-md text-slate-700 font-medium text-xs">
                        {row.total_items}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.assignment_date
                        ? new Date(row.assignment_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <button
                          className="text-slate-500 hover:text-blue-600"
                          title="View"
                          onClick={() => handleView(row)}
                        >
                          <FaEye />
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                          onClick={() => handleEdit(row)}
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-6 text-center text-slate-500"
                  >
                    No assignments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => previous && loadData(page - 1)}
            disabled={!previous}
            className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
          >
            ← Previous
          </button>

          <button
            onClick={() => next && loadData(page + 1)}
            disabled={!next}
            className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

      <VendorAssignmentModal
        open={openModal}
        editData={editData}
        viewOnly={viewOnly}
        onClose={() => setOpenModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default VendorAssignment;
