import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box, Card, Typography, Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, CircularProgress, Chip, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
  RadioGroup, Radio, FormControlLabel
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Visibility as ViewIcon,
  FileDownload as ExcelIcon, Search as SearchIcon,
  ChevronLeft as PrevIcon, ChevronRight as NextIcon,
} from "@mui/icons-material";
import {
  fetchRequisitions,
  deleteRequisition,
  getRequisitionReport,
  getRequisitionDetailReport
} from "../services/requisition";
import RequisitionModal from "../components/requisition/RequisitionModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AlertToast from "../components/ui/AlertToast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";

const Requisition = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Pagination State
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [page, setPage] = useState(1);

  // Filter State
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "true" | "false"
  const [dateFilter, setDateFilter] = useState("");

  /* =========================
     MODAL STATE
     ========================= */
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);

  /* =========================
     CONFIRMATION & TOAST
     ========================= */
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [passwordModal, setPasswordModal] = useState({ open: false, onConfirm: null, loading: false });

  /* =========================
     REPORT STATE
     ========================= */
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("date_range"); // "date_range", "pending", "requisition_id"
  const [reportDates, setReportDates] = useState({ start: "", end: "" });
  const [selectedReqId, setSelectedReqId] = useState("");
  const [allRequisitions, setAllRequisitions] = useState([]);
  const [downloading, setDownloading] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const loadData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await fetchRequisitions(pageNum, searchText, statusFilter, dateFilter);
      const data = res.data;
      if (data.results) {
        setList(data.results);
        setCount(data.count || data.results.length);
        setNext(data.next);
        setPrevious(data.previous);
      } else {
        setList(Array.isArray(data) ? data : []);
        setCount(Array.isArray(data) ? data.length : 0);
      }
      setPage(pageNum);
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        type: "error",
        message: "Failed to load requisitions",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, statusFilter, dateFilter]);

  // Check for view_id param
  useEffect(() => {
    const viewId = searchParams.get("view_id");
    if (viewId && viewId.length === 36) {
      setEditData({ id: viewId });
      setViewOnly(true);
      setOpenModal(true);
    }
  }, [searchParams]);

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
    navigate("/requisition/create");
  };

  const confirmDelete = () => {
    setShowConfirm(false);
    setPasswordModal({
      open: true,
      loading: false,
      onConfirm: async (password) => {
        setPasswordModal(prev => ({ ...prev, loading: true }));
        try {
          const res = await deleteRequisition(selectedItem.id, { confirm_password: password });
          setToast({
            open: true,
            type: "success",
            message: res.data?.message || res.message || "Requisition deleted successfully",
          });
          loadData(page);
          setPasswordModal({ open: false });
        } catch (err) {
          console.error(err);
          const errorMsg = err.response?.data?.message || err.response?.data?.detail || "Failed to delete requisition";
          setToast({
            open: true,
            type: "error",
            message: errorMsg,
          });
          setPasswordModal(prev => ({ ...prev, loading: false }));
        } finally {
          setSelectedItem(null);
        }
      }
    });
  };

  const handleSuccess = () => {
    loadData(page);
    setToast({
      open: true,
      type: "success",
      message: editData ? "Requisition updated successfully" : "Requisition created successfully",
    });
  };

  /* =========================
     REPORT HANDLER
     ========================= */
  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const params = {};
      let filenamePrefix = "Requisition_Report";

      let detailedData = null;

      if (reportType === "date_range") {
        if (!reportDates.start || !reportDates.end) {
          setToast({ open: true, type: "error", message: "Please select start and end dates" });
          setDownloading(false);
          return;
        }
        params.start_date = reportDates.start;
        params.end_date = reportDates.end;
        filenamePrefix = `Requisition_Report_${params.start_date}_to_${params.end_date}`;

      } else if (reportType === "pending") {
        params.status = "pending";
        filenamePrefix = "Pending_Requisition_Report";

      } else if (reportType === "requisition_id") {
        if (!selectedReqId) {
          setToast({ open: true, type: "error", message: "Please select a requisition" });
          setDownloading(false);
          return;
        }
        const selectedReq = allRequisitions.find(r => r.id === selectedReqId);
        const reqNo = selectedReq ? selectedReq.requisition_number : "Detail";
        filenamePrefix = `Requisition_Report_${reqNo.replace(/[\s]+/g, '_')}`;

        const res = await getRequisitionDetailReport(selectedReqId);
        detailedData = res.data;
      }

      // If detailed report (Single Requisition)
      if (detailedData) {
        const wb = XLSX.utils.book_new();

        const reqData = Array.isArray(detailedData) ? detailedData[0] : detailedData;

        // --- SUMMARY SHEET ---
        const summarySheetData = [
          ["REQUISITION DETAILS"],
          ["Requisition No:", reqData.requisition_number],
          ["Date:", reqData.requisition_date],
          ["Status:", reqData.is_assigned ? "Assigned" : "Open"],
          ["Created By:", reqData.created_by],
          ["Remarks:", reqData.remarks || "-"],
          ["Generated At:", reqData.generated_at ? new Date(reqData.generated_at).toLocaleString() : new Date().toLocaleString()],
          [],
          ["ITEMS"],
          ["Code", "Product Name", "Qty", "Unit", "Rate", "Est Value", "Remarks"]
        ];

        if (reqData.items && reqData.items.length > 0) {
          reqData.items.forEach(item => {
            summarySheetData.push([
              item.product_code,
              item.product_name,
              item.quantity,
              item.unit,
              item.rate,
              item.estimated_value,
              item.remarks
            ]);
          });
          summarySheetData.push([]);
          summarySheetData.push(["", "", "", "Total Items:", reqData.total_items, "Total Value:", reqData.estimated_total_value]);
        } else {
          summarySheetData.push(["No items found"]);
        }

        const ws = XLSX.utils.aoa_to_sheet(summarySheetData);
        XLSX.utils.book_append_sheet(wb, ws, "Requisition Details");

        // Generate Buffer
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(blob, `${filenamePrefix}.xlsx`);

        setShowReportModal(false);
        setToast({ open: true, type: "success", message: "Detailed report downloaded" });
        setDownloading(false);
        return;
      }

      console.log("Fetching requisition report with params:", params);
      const res = await getRequisitionReport(params);
      const data = res.data;

      // Process data for Excel
      const rows = [];

      if (data.requisitions && Array.isArray(data.requisitions)) {
        data.requisitions.forEach(req => {
          if (req.items && req.items.length > 0) {
            req.items.forEach(item => {
              rows.push({
                "Req No": req.requisition_number,
                "Date": req.requisition_date,
                "Created By": req.created_by,
                "Status": req.status,
                "Remarks": req.remarks || "",
                "Item Code": item.product_code,
                "Item Name": item.product_name,
                "Quantity": item.quantity,
                "Unit": item.unit,
                "Item Remarks": item.remarks || ""
              });
            });
          } else {
            rows.push({
              "Req No": req.requisition_number,
              "Date": req.requisition_date,
              "Created By": req.created_by,
              "Status": req.status,
              "Remarks": req.remarks || "",
              "Item Code": "-",
              "Item Name": "-",
              "Quantity": "-",
              "Unit": "-",
              "Item Remarks": "-"
            });
          }
        });
      }

      if (rows.length === 0) {
        setToast({ open: true, type: "info", message: "No data found for the selected range" });
        setDownloading(false);
        return;
      }

      const wb = XLSX.utils.book_new();

      const finalSheetData = [
        [data.report_type || "REQUISITION REPORT"],
        [],
        ["Generated By:", data.generated_by || "System"],
        ["Generated At:", new Date(data.generated_at).toLocaleString()],
        ["Date Range:", `${data.date_range?.start_date} to ${data.date_range?.end_date}`],
        [],
        ["SUMMARY STATISTICS"],
        ["Total Requisitions:", data.summary?.total_requisitions || 0],
        ["Total Items:", data.summary?.total_items || 0],
        ["Pending Requisitions:", data.summary?.pending_requisitions || 0],
        ["Assigned Requisitions:", data.summary?.assigned_requisitions || 0],
        [],
        ["Req No", "Date", "Created By", "Status", "Remarks", "Item Code", "Item Name", "Quantity", "Unit", "Item Remarks"],
      ];

      rows.forEach(r => {
        finalSheetData.push([
          r["Req No"],
          r["Date"],
          r["Created By"],
          r["Status"],
          r["Remarks"],
          r["Item Code"],
          r["Item Name"],
          r["Quantity"],
          r["Unit"],
          r["Item Remarks"]
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(finalSheetData);
      XLSX.utils.book_append_sheet(wb, worksheet, "Requisition Report");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });

      saveAs(blob, `${filenamePrefix}.xlsx`);

      setShowReportModal(false);
      setToast({ open: true, type: "success", message: "Report downloaded successfully" });

    } catch (err) {
      console.error("Download failed", err);
      setToast({ open: true, type: "error", message: "Failed to download report" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box>
      <Card>
        {/* HEADER */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Requisitions</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Total: {count}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<ExcelIcon />}
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                setReportDates({ start: firstDay, end: today });
                setShowReportModal(true);
              }}
            >
              Download Report
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' } }}
            >
              New Requisition
            </Button>
          </Box>
        </Box>

        {/* SEARCH & FILTER */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FAFBFC', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            size="small"
            placeholder="Search by req no, items..."
            label="Search Requisition"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />
          <TextField
            size="small"
            type="date"
            label="Date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            sx={{ width: 170 }}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="false">Open</MenuItem>
              <MenuItem value="true">Assigned</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* TABLE */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Req No</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} align="center">Items</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : list.length > 0 ? (
                list.map((row, index) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      bgcolor: index % 2 === 0 ? '#FAFBFC' : 'white',
                      '&:hover': { bgcolor: '#EEF2F6' },
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: '#1565C0',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => handleView(row)}
                      >
                        {row.requisition_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {new Date(row.requisition_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {row.created_by_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${row.total_items} items`}
                        size="small"
                        sx={{ bgcolor: '#F1F5F9', color: 'text.primary', fontWeight: 500, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      {row.is_assigned ? (
                        <Chip
                          label="Assigned"
                          size="small"
                          sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      ) : (
                        <Chip
                          label="Open"
                          size="small"
                          sx={{ bgcolor: '#FFF8E1', color: '#F57F17', fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleView(row)} color="default">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={row.is_assigned ? "Editing Disabled (Assigned)" : "Edit"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(row)}
                              disabled={row.is_assigned}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No requisitions found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* PAGINATION */}
        <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            size="small"
            startIcon={<PrevIcon />}
            disabled={!previous}
            onClick={() => previous && loadData(page - 1)}
            sx={{ fontWeight: 600 }}
          >
            Previous
          </Button>
          <Typography variant="caption" color="text.secondary">Page {page}</Typography>
          <Button
            size="small"
            endIcon={<NextIcon />}
            disabled={!next}
            onClick={() => next && loadData(page + 1)}
            sx={{ fontWeight: 600 }}
          >
            Next
          </Button>
        </Box>
      </Card>

      {/* Modals */}
      <RequisitionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        editData={editData}
        viewOnly={viewOnly}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete Requisition"
        message={`Are you sure you want to delete "${selectedItem?.requisition_number}"?`}
        confirmText="Delete"
        loading={deleting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
      />

      <AlertToast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <PasswordConfirmModal
        open={passwordModal.open}
        loading={passwordModal.loading}
        title="Confirm Delete"
        message={`Please enter your password to delete "${selectedItem?.requisition_number}".`}
        onConfirm={passwordModal.onConfirm}
        onCancel={() => setPasswordModal({ open: false })}
      />

      {/* REPORT MODAL */}
      <Dialog open={showReportModal} onClose={() => setShowReportModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExcelIcon sx={{ color: 'success.main' }} /> Export Report
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
            Select Report Type:
          </Typography>

          <RadioGroup value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {/* Date Range Option */}
            <FormControlLabel
              value="date_range"
              control={<Radio size="small" />}
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Date Range</Typography>}
              sx={{
                border: '1px solid', borderColor: 'divider', borderRadius: 2,
                mx: 0, mb: 1, px: 1, '&:hover': { bgcolor: '#FAFBFC' }
              }}
            />
            {reportType === "date_range" && (
              <Box sx={{ pl: 4, mb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  size="small"
                  type="date"
                  label="Start Date"
                  value={reportDates.start}
                  onChange={(e) => setReportDates({ ...reportDates, start: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="End Date"
                  value={reportDates.end}
                  onChange={(e) => setReportDates({ ...reportDates, end: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            )}

            {/* Pending Option */}
            <FormControlLabel
              value="pending"
              control={<Radio size="small" />}
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Pending Requisitions</Typography>}
              sx={{
                border: '1px solid', borderColor: 'divider', borderRadius: 2,
                mx: 0, mb: 1, px: 1, '&:hover': { bgcolor: '#FAFBFC' }
              }}
            />

            {/* Requisition ID Option */}
            <FormControlLabel
              value="requisition_id"
              control={
                <Radio
                  size="small"
                  onChange={(e) => {
                    if (e.target.checked && allRequisitions.length === 0) {
                      fetchRequisitions(1).then(res => {
                        const results = res.data.results || (Array.isArray(res.data) ? res.data : []);
                        setAllRequisitions(results);
                      });
                    }
                  }}
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Specific Requisition</Typography>}
              sx={{
                border: '1px solid', borderColor: 'divider', borderRadius: 2,
                mx: 0, mb: 1, px: 1, '&:hover': { bgcolor: '#FAFBFC' }
              }}
            />
            {reportType === "requisition_id" && (
              <Box sx={{ pl: 4, mb: 1.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Select Requisition</InputLabel>
                  <Select
                    value={selectedReqId}
                    label="Select Requisition"
                    onChange={(e) => setSelectedReqId(e.target.value)}
                  >
                    <MenuItem value="">-- Select Requisition --</MenuItem>
                    {allRequisitions.map(req => (
                      <MenuItem key={req.id} value={req.id}>
                        {req.requisition_number} ({req.created_by_name || req.created_by})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportModal(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDownloadReport}
            disabled={downloading}
            variant="contained"
            color="success"
            startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <ExcelIcon />}
          >
            {downloading ? "Downloading..." : "Download Excel"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Requisition;
