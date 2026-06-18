import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Box, Card, Typography, Button, TextField, MenuItem, Select, FormControl,
    InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, RadioGroup, FormControlLabel, Radio, InputAdornment, Chip
} from "@mui/material";
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Visibility as ViewIcon, FileDownload as ExcelIcon,
    Upload as UploadIcon, Search as SearchIcon,
    ChevronLeft as PrevIcon, ChevronRight as NextIcon,
} from "@mui/icons-material";
import ProductModal from "../components/products/ProductModal";
import ProductViewModal from "../components/products/ProductViewModal";
import BulkProductModal from "../components/products/BulkProductModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AlertToast from "../components/ui/AlertToast";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";
import { getProducts, deleteProduct, getProduct, getStockReport, getMovementReport, getLowStockProducts } from "../services/productService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [unitFilter, setUnitFilter] = useState("");
    const [searchParams] = useSearchParams();
    const [stockFilter, setStockFilter] = useState("all");
    const [page, setPage] = useState(1);

    useEffect(() => {
        const filter = searchParams.get("filter");
        if (filter === "low_stock") setStockFilter("low_stock");
    }, [searchParams]);

    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [passwordModal, setPasswordModal] = useState({ open: false, onConfirm: null, loading: false });
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewProduct, setViewProduct] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [reportType, setReportType] = useState("stock");
    const [downloading, setDownloading] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    const fetchProducts = async (pageNum = 1) => {
        try {
            setLoading(true);
            if (stockFilter === "low_stock") {
                const res = await getLowStockProducts();
                const data = res.data;
                if (Array.isArray(data)) {
                    setProducts(data); setCount(data.length); setNext(null); setPrevious(null);
                } else {
                    setProducts(data.results || []); setCount(data.count || 0); setNext(data.next); setPrevious(data.previous);
                }
            } else {
                const res = await getProducts({
                    search: searchText, unit: unitFilter,
                    url: pageNum > 1 ? `/api/products?page=${pageNum}${searchText ? `&search=${encodeURIComponent(searchText)}` : ""}${unitFilter ? `&unit=${encodeURIComponent(unitFilter)}` : ""}` : undefined,
                });
                setProducts(res.data.results); setCount(res.data.count); setNext(res.data.next); setPrevious(res.data.previous);
            }
            setPage(pageNum);
        } catch (err) { console.log(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchProducts(1), 500);
        return () => clearTimeout(timer);
    }, [searchText, unitFilter, stockFilter]);

    const handlePageChange = (newPage) => fetchProducts(newPage);
    const handleAddProduct = () => { setEditProduct(null); setOpenModal(true); };
    const handleEdit = (item) => { setEditProduct(item); setOpenModal(true); };
    const handleDelete = (item) => { setSelectedProduct(item); setShowConfirm(true); };

    const handleView = async (item) => {
        setViewModalOpen(true); setViewLoading(true); setViewProduct(null);
        try {
            const res = await getProduct(item.id); setViewProduct(res.data);
        } catch (err) {
            setToast({ open: true, type: "error", message: "Failed to load product details" }); setViewModalOpen(false);
        } finally { setViewLoading(false); }
    };

    const handleProductSuccess = (mode) => {
        setToast({ open: true, type: "success", message: mode === "edit" ? "Product updated successfully" : "Product added successfully" });
        fetchProducts(mode === "edit" ? page : 1);
    };

    const confirmDelete = () => {
        setShowConfirm(false);
        setPasswordModal({
            open: true, loading: false,
            onConfirm: async (password) => {
                setPasswordModal(prev => ({ ...prev, loading: true }));
                try {
                    const res = await deleteProduct(selectedProduct.id, { confirm_password: password });
                    setToast({ open: true, type: "success", message: res.data?.message || res.message || "Product deleted successfully" });
                    fetchProducts(1); setPasswordModal({ open: false });
                } catch (err) {
                    const errorMsg = err.response?.data?.message || err.response?.data?.detail || "Failed to delete product";
                    setToast({ open: true, type: "error", message: errorMsg }); setPasswordModal(prev => ({ ...prev, loading: false }));
                } finally { setSelectedProduct(null); }
            }
        });
    };

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const wb = XLSX.utils.book_new();
            let finalSheetData = []; let sheetName = ""; let filePrefix = "";
            if (reportType === "stock") {
                const res = await getStockReport(); const data = res.data;
                if (!data) throw new Error("No data received from API");
                const productsList = data.products || [];
                sheetName = "Stock Report"; filePrefix = "Inventory_Stock_Report";
                finalSheetData = [
                    [data.report_type || "INVENTORY STOCK REPORT"], ["Purpose:", "Stock Report"],
                    ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()], [],
                    ["OVERALL SUMMARY"], ["Total Products:", data.summary?.total_products || 0],
                    ["Total Value:", data.summary?.total_inventory_value || 0], ["Healthy Stock:", data.summary?.healthy_stock || 0],
                    ["Low Stock:", data.summary?.low_stock || 0], ["Out of Stock:", data.summary?.out_of_stock || 0], [],
                    ["Item Code", "Item Name", "Current Stock", "Reorder Level", "Unit", "Rate", "Stock Value", "Status", "HSN Code"]
                ];
                productsList.forEach(p => {
                    let status = p.stock_status || "Healthy";
                    if (p.current_stock <= 0) status = "Out of Stock";
                    else if (p.current_stock <= p.reorder_level) status = "Low Stock";
                    finalSheetData.push([p.item_code, p.item_name, p.current_stock, p.reorder_level, p.unit, p.rate, p.stock_value, status, p.hsn_code]);
                });
            } else {
                const res = await getMovementReport(); const data = res.data;
                if (!data) throw new Error("No data received from API");
                sheetName = "Movement Report"; filePrefix = "Inventory_Movement_Report";
                let movementsList = [];
                if (Array.isArray(data)) movementsList = data;
                else if (data && typeof data === "object") { const arrayKey = Object.keys(data).find(key => Array.isArray(data[key])); if (arrayKey) movementsList = data[arrayKey]; else movementsList = [data]; }
                const headers = []; const keys = [];
                if (movementsList.length > 0) { Object.keys(movementsList[0]).forEach(key => { headers.push(key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")); keys.push(key); }); }
                else { headers.push("Message"); keys.push("msg"); movementsList = [{ msg: "No movement records found" }]; }
                finalSheetData = [[data.report_type || "INVENTORY MOVEMENT REPORT"], ["Purpose:", "Movement Report"], ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()], [], headers];
                movementsList.forEach(item => { finalSheetData.push(keys.map(key => { const val = item[key]; if (val == null) return "-"; if (typeof val === "object") return JSON.stringify(val); return val; })); });
            }
            const worksheet = XLSX.utils.aoa_to_sheet(finalSheetData);
            XLSX.utils.book_append_sheet(wb, worksheet, sheetName);
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" }), `${filePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`);
            setShowReportModal(false); setToast({ open: true, type: "success", message: "Report downloaded successfully" });
        } catch (err) { setToast({ open: true, type: "error", message: `Failed to download report: ${err.message || 'Unknown error'}` }); }
        finally { setDownloading(false); }
    };

    return (
        <Box>
            <Card>
                {/* Header */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Products</Typography>
                        <Typography variant="caption" color="text.secondary">Total: {count}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="contained" color="success" startIcon={<ExcelIcon />} onClick={() => setShowReportModal(true)}>
                            Export Excel
                        </Button>
                        <Button size="small" variant="contained" sx={{ bgcolor: '#5E35B1', '&:hover': { bgcolor: '#4527A0' } }} startIcon={<UploadIcon />} onClick={() => setShowBulkModal(true)}>
                            Bulk Entry
                        </Button>
                        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleAddProduct}>
                            Add Product
                        </Button>
                    </Box>
                </Box>

                {/* Filters */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FAFBFC', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Stock Status</InputLabel>
                        <Select value={stockFilter} label="Stock Status" onChange={e => setStockFilter(e.target.value)}>
                            <MenuItem value="all">All Stock</MenuItem>
                            <MenuItem value="low_stock">Low Stock</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        size="small" placeholder="Search by product name" value={searchText}
                        onChange={e => setSearchText(e.target.value)} sx={{ flex: 1, minWidth: 200 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} /></InputAdornment> }}
                    />
                    <TextField size="small" placeholder="e.g. pcs, kg" label="Unit" value={unitFilter} onChange={e => setUnitFilter(e.target.value)} sx={{ width: 140 }} />
                </Box>

                {/* Table */}
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Item Code</TableCell>
                                <TableCell sx={{ minWidth: 180 }}>Item Name</TableCell>
                                <TableCell sx={{ minWidth: 180 }}>Description</TableCell>
                                <TableCell>HSN</TableCell>
                                <TableCell>Unit</TableCell>
                                <TableCell align="right">Rate</TableCell>
                                <TableCell>Req. Number</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && (
                                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <CircularProgress size={28} />
                                </TableCell></TableRow>
                            )}
                            {!loading && products.length === 0 && (
                                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">No products found</Typography>
                                </TableCell></TableRow>
                            )}
                            {!loading && products.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{item.item_code}</Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{item.item_name}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>
                                            {item.description || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{item.hsn_code}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{item.unit}</Typography></TableCell>
                                    <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 700 }}>₹{item.rate}</Typography></TableCell>
                                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{item.requisition_number || "-"}</Typography></TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="View"><IconButton size="small" onClick={() => handleView(item)} color="default"><ViewIcon fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(item)} color="primary"><EditIcon fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(item)} color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Button size="small" startIcon={<PrevIcon />} disabled={!previous} onClick={() => handlePageChange(page - 1)} sx={{ fontWeight: 600 }}>
                        Previous
                    </Button>
                    <Typography variant="caption" color="text.secondary">Page {page}</Typography>
                    <Button size="small" endIcon={<NextIcon />} disabled={!next} onClick={() => handlePageChange(page + 1)} sx={{ fontWeight: 600 }}>
                        Next
                    </Button>
                </Box>
            </Card>

            {/* Modals */}
            <ProductModal key={editProduct ? editProduct.id : "add"} open={openModal} onClose={() => { setOpenModal(false); setEditProduct(null); }} onSuccess={handleProductSuccess} mode={editProduct ? "edit" : "add"} product={editProduct} />
            <ProductViewModal open={viewModalOpen} onClose={() => setViewModalOpen(false)} data={viewProduct} loading={viewLoading} />
            <BulkProductModal open={showBulkModal} onClose={() => setShowBulkModal(false)} onSuccess={() => fetchProducts(1)} />
            <ConfirmDialog open={showConfirm} title="Delete Product" message={`Are you sure you want to delete "${selectedProduct?.item_name}"?`} confirmText="Delete" loading={deleting} onCancel={() => setShowConfirm(false)} onConfirm={confirmDelete} />
            <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
            <PasswordConfirmModal open={passwordModal.open} loading={passwordModal.loading} title="Confirm Delete" message={`Please enter your password to delete "${selectedProduct?.item_name}".`} onConfirm={passwordModal.onConfirm} onCancel={() => setPasswordModal({ open: false })} />

            {/* Report Modal */}
            <Dialog open={showReportModal} onClose={() => setShowReportModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ExcelIcon sx={{ color: 'success.main' }} /> Export Inventory
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Choose Report Type:</Typography>
                    <RadioGroup value={reportType} onChange={e => setReportType(e.target.value)}>
                        <FormControlLabel value="stock" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Stock Report</Typography>}
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mx: 0, mb: 1, px: 1, '&:hover': { bgcolor: '#FAFBFC' } }} />
                        <FormControlLabel value="movement" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Movement Report</Typography>}
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mx: 0, px: 1, '&:hover': { bgcolor: '#FAFBFC' } }} />
                    </RadioGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowReportModal(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleDownloadReport} disabled={downloading} variant="contained" color="success" startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <ExcelIcon />}>
                        {downloading ? "Exporting..." : "Download Excel"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
