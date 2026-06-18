import { useEffect, useState } from "react";
import {
  Box, Container, Typography, Paper, Button, Card, CardContent,
  Chip, CircularProgress, Tab, Tabs, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Divider
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Description as DocIcon
} from "@mui/icons-material";
import AlertToast from "../ui/AlertToast";
import { apiGet, apiPost } from "../../services/api";

const fmtMoney = (v, ccy) => {
  const n = Number(v || 0);
  return `${ccy || ""} ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
};

const errMsg = (err, fallback) =>
  err?.data?.error || err?.data?.detail || err?.message || fallback;

/** Read-only summary of the PI/PO being verified */
const DocumentDetails = ({ doc }) => {
  if (!doc) return null;
  const isPI = doc.type === "PI";
  return (
    <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ bgcolor: "#0f172a", color: "white", px: 2, py: 1.2, display: "flex", alignItems: "center", gap: 1 }}>
        <DocIcon fontSize="small" />
        <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
          {isPI ? "Proforma Invoice" : "Purchase Order"} — {doc.number}
        </Typography>
        {doc.status && (
          <Chip label={doc.status} size="small" sx={{ ml: "auto", height: 20, fontSize: 10, fontWeight: 800, bgcolor: "#334155", color: "white" }} />
        )}
      </Box>

      <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}>
        <Field label={isPI ? "Client / Consignee" : "Vendor"} value={doc.party || "—"} />
        <Field label="Date" value={doc.date || "—"} />
        <Field label="Currency" value={doc.currency || "—"} />
        {isPI
          ? <Field label="Trade Type" value={doc.trade_type || "—"} />
          : <Field label="Project" value={doc.project_name || "—"} />}
        <Field label="Grand Total" value={fmtMoney(doc.grand_total, doc.currency)} strong />
        <Field label="Balance" value={fmtMoney(doc.balance, doc.currency)} />
      </Box>

      {doc.items?.length > 0 && (
        <>
          <Divider />
          <Box sx={{ px: 1, py: 0.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>Item</TableCell>
                  {isPI && <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>HSN</TableCell>}
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11 }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11 }}>{isPI ? "Unit Price" : "Rate"}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11 }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doc.items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontSize: 12 }}>{it.name || "—"}</TableCell>
                    {isPI && <TableCell sx={{ fontSize: 12 }}>{it.hsn_code || "—"}</TableCell>}
                    <TableCell align="right" sx={{ fontSize: 12 }}>{Number(it.quantity).toLocaleString("en-IN")}</TableCell>
                    <TableCell align="right" sx={{ fontSize: 12 }}>{fmtMoney(isPI ? it.unit_price : it.rate, doc.currency)}</TableCell>
                    <TableCell align="right" sx={{ fontSize: 12 }}>{fmtMoney(it.amount, doc.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Box>
  );
};

const Field = ({ label, value, strong }) => (
  <Box>
    <Typography sx={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.3 }}>{label}</Typography>
    <Typography sx={{ fontSize: 13, color: "#1e293b", fontWeight: strong ? 800 : 600 }}>{value}</Typography>
  </Box>
);

const VerifierDashboard = () => {
  const [tab, setTab] = useState(0);
  const [docTypeTab, setDocTypeTab] = useState(0); // 0=PI, 1=PO
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, action: null });
  const [viewModal, setViewModal] = useState({ open: false, doc: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "error", message: "" });

  useEffect(() => {
    loadVerifications();
  }, [tab, docTypeTab]);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const status = tab === 0 ? "PENDING" : tab === 1 ? "VERIFIED" : "REJECTED";
      const endpoint = docTypeTab === 0
        ? `/api/pi-verifications/?status=${status}`
        : `/api/po-verifications/?status=${status}`;
      const data = await apiGet(endpoint);
      setRequests(data.results || []);
    } catch (err) {
      setToast({ open: true, type: "error", message: errMsg(err, "Failed to load verifications") });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      const docPath = docTypeTab === 0 ? "pi" : "po";
      await apiPost(
        `/api/${docPath}/${selectedRequest.id}/approve-verification/`,
        { notes: actionModal.notes || "" }
      );

      setToast({ open: true, type: "success", message: "Verification approved!" });
      setActionModal({ open: false, action: null });
      setSelectedRequest(null);
      loadVerifications();
    } catch (err) {
      setToast({ open: true, type: "error", message: errMsg(err, "Failed to approve verification") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      setToast({ open: true, type: "error", message: "Please provide a rejection reason" });
      return;
    }

    setSubmitting(true);
    try {
      const docPath = docTypeTab === 0 ? "pi" : "po";
      await apiPost(
        `/api/${docPath}/${selectedRequest.id}/reject-verification/`,
        { rejection_reason: rejectionReason }
      );

      setToast({ open: true, type: "success", message: "Verification rejected" });
      setActionModal({ open: false, action: null });
      setSelectedRequest(null);
      setRejectionReason("");
      loadVerifications();
    } catch (err) {
      setToast({ open: true, type: "error", message: errMsg(err, "Failed to reject verification") });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "PENDING") return "#f59e0b";
    if (status === "VERIFIED") return "#10b981";
    if (status === "REJECTED") return "#ef4444";
    return "#64748b";
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: "#1a1a2e", mb: 1 }}>
            ✓ {docTypeTab === 0 ? "PI" : "PO"} Verification Requests
          </Typography>
          <Typography sx={{ fontSize: "13px", color: "#64748b" }}>
            Review and sign {docTypeTab === 0 ? "Proforma Invoices" : "Purchase Orders"} sent by others
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadVerifications}
          disabled={loading}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {/* DOCUMENT TYPE TABS */}
      <Box sx={{ borderBottom: "1px solid #e2e8f0", mb: 3 }}>
        <Tabs value={docTypeTab} onChange={(e, v) => setDocTypeTab(v)}>
          <Tab label="📄 Proforma Invoice (PI)" />
          <Tab label="📦 Purchase Order (PO)" />
        </Tabs>
      </Box>

      {/* STATUS TABS */}
      <Box sx={{ borderBottom: "1px solid #e2e8f0", mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="📋 Pending" />
          <Tab label="✓ Verified" />
          <Tab label="✗ Rejected" />
        </Tabs>
      </Box>

      {/* CONTENT */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", bgcolor: "#f8fafc" }}>
          <Typography sx={{ color: "#94a3b8", fontStyle: "italic" }}>
            No {tab === 0 ? "pending" : tab === 1 ? "verified" : "rejected"} {docTypeTab === 0 ? "PI" : "PO"} verifications
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {requests.map((req) => (
            <Card key={req.id} sx={{ border: "1px solid #dbeafe" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                      <Typography sx={{ fontWeight: 900, color: "#1e293b" }}>
                        {docTypeTab === 0 ? `PI #${req.pi_number}` : `PO #${req.po_number}`}
                      </Typography>
                      <Chip
                        label={req.status}
                        size="small"
                        sx={{ bgcolor: getStatusColor(req.status), color: "white" }}
                      />
                    </Box>

                    <Typography sx={{ fontSize: "13px", color: "#64748b", mb: 1.5 }}>
                      Requested by: <strong>{req.created_by?.full_name}</strong>
                    </Typography>

                    {/* Quick summary line so the verifier sees what it is */}
                    {req.document && (
                      <Typography sx={{ fontSize: "12.5px", color: "#475569", mb: 1 }}>
                        {req.document.party || "—"} · {fmtMoney(req.document.grand_total, req.document.currency)} · {req.document.items?.length || 0} item(s)
                      </Typography>
                    )}

                    {req.notes && (
                      <Alert severity="info" sx={{ my: 1.5 }}>
                        {req.notes}
                      </Alert>
                    )}

                    <Typography sx={{ fontSize: "12px", color: "#94a3b8", mt: 1 }}>
                      Created: {new Date(req.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-end" }}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      variant="outlined"
                      onClick={() => setViewModal({ open: true, doc: req.document })}
                    >
                      View Document
                    </Button>

                    {tab === 0 && (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ApproveIcon />}
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionModal({ open: true, action: "approve" });
                          }}
                          sx={{ bgcolor: "#10b981" }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<RejectIcon />}
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionModal({ open: true, action: "reject" });
                          }}
                          color="error"
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* VIEW DOCUMENT MODAL */}
      <Dialog open={viewModal.open} onClose={() => setViewModal({ open: false, doc: null })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Document Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <DocumentDetails doc={viewModal.doc} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModal({ open: false, doc: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ACTION MODAL */}
      <Dialog open={actionModal.open} onClose={() => setActionModal({ open: false, action: null })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: "#1a1a2e", color: "white", fontWeight: 900 }}>
          {actionModal.action === "approve" ? "✓ Approve Verification" : "✗ Reject Verification"}
        </DialogTitle>

        <DialogContent sx={{ bgcolor: "#f1f5f9", p: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {/* Always show what is being signed */}
            {selectedRequest?.document && <DocumentDetails doc={selectedRequest.document} />}

            {actionModal.action === "approve" && (
              <>
                <Alert severity="success">
                  You are about to approve this document with your signature.
                </Alert>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Optional Notes"
                  placeholder="Add any approval notes..."
                  defaultValue={actionModal.notes || ""}
                  onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })}
                />
              </>
            )}

            {actionModal.action === "reject" && (
              <>
                <Alert severity="error">
                  You are about to reject this verification request. Provide a reason below.
                </Alert>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Rejection Reason *"
                  placeholder="Why are you rejecting this?"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  error={!rejectionReason && submitting}
                />
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setActionModal({ open: false, action: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={actionModal.action === "approve" ? handleApprove : handleReject}
            disabled={submitting || (actionModal.action === "reject" && !rejectionReason.trim())}
            sx={{ bgcolor: actionModal.action === "approve" ? "#10b981" : "#ef4444" }}
          >
            {submitting ? "Processing..." : actionModal.action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      <AlertToast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Container>
  );
};

export default VerifierDashboard;
