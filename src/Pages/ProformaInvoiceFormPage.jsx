import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { toast } from "react-hot-toast";

import ClientQuotationModal from "../components/sales/ClientQuotationModal";
import {
    getProformaInvoiceById, lockProformaInvoice, unlockProformaInvoice,
} from "../services/salesService";

const LIST_PATH = "/sales/proforma-invoice";

/**
 * Full-page wrapper for creating / editing a Proforma Invoice.
 * Reuses ClientQuotationModal in `variant="page"` so the design stays identical.
 */
const ProformaInvoiceFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(isEdit);
    const [locked, setLocked] = useState(false);

    useEffect(() => {
        if (!isEdit) return;
        let active = true;
        (async () => {
            try {
                await lockProformaInvoice(id);
                if (active) setLocked(true);
                const data = await getProformaInvoiceById(id);
                if (active) setInvoice(data);
            } catch (err) {
                console.error("Failed to open PI for editing", err);
                toast.error("Could not open for editing — it may be locked by another user.");
                navigate(LIST_PATH);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [id]);

    const releaseLock = async () => {
        if (isEdit && locked) {
            try { await unlockProformaInvoice(id); } catch { /* ignore */ }
        }
    };

    const goBack = async () => {
        await releaseLock();
        navigate(LIST_PATH);
    };

    const handleSuccess = async () => {
        // lock is released by goBack (modal calls onClose right after onSuccess)
        navigate(LIST_PATH);
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: "center", py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <ClientQuotationModal
            variant="page"
            isOpen
            invoice={isEdit ? invoice : null}
            onClose={goBack}
            onSuccess={handleSuccess}
        />
    );
};

export default ProformaInvoiceFormPage;
