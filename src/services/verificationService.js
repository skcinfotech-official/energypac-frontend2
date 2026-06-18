import { apiGet } from "./api";

export const verificationService = {
  // Get pending PI verifications count
  async getPendingPICount() {
    try {
      const data = await apiGet("/api/pi-verifications/?status=PENDING");
      return (data.results || []).length;
    } catch (err) {
      console.error("Failed to get pending PI count:", err);
      return 0;
    }
  },

  // Get pending PO verifications count
  async getPendingPOCount() {
    try {
      const data = await apiGet("/api/po-verifications/?status=PENDING");
      return (data.results || []).length;
    } catch (err) {
      console.error("Failed to get pending PO count:", err);
      return 0;
    }
  },

  // Get total pending verifications (PI + PO)
  async getTotalPendingCount() {
    try {
      const piCount = await this.getPendingPICount();
      const poCount = await this.getPendingPOCount();
      return piCount + poCount;
    } catch (err) {
      console.error("Failed to get total pending count:", err);
      return 0;
    }
  },

  // Get verification status for a specific PO
  async getPOVerificationStatus(poId) {
    try {
      const data = await apiGet(`/api/po/${poId}/verification-status/`);
      console.log(`[Verification] PO ${poId} status:`, data);
      // Backend returns 'current_status', but we need 'status' for consistency
      if (data && data.current_status) {
        return { status: data.current_status };
      }
      return { status: 'NOT_SENT' };
    } catch (err) {
      console.error(`[Verification] Failed to get PO ${poId} verification status:`, err);
      return { status: 'NOT_SENT' };
    }
  },

  // Get verification status for a specific PI
  async getPIVerificationStatus(piId) {
    try {
      const data = await apiGet(`/api/pi/${piId}/verification-status/`);
      console.log(`[Verification] PI ${piId} status:`, data);
      // Backend returns 'current_status', but we need 'status' for consistency
      if (data && data.current_status) {
        return { status: data.current_status };
      }
      return { status: 'NOT_SENT' };
    } catch (err) {
      console.error(`[Verification] Failed to get PI ${piId} verification status:`, err);
      return { status: 'NOT_SENT' };
    }
  },
};
