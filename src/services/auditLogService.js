import axiosSecure from "../api/axiosSecure";

/* =========================
   AUDIT LOG APIs
   ========================= */

// LIST (with pagination, search, action, and model filtering support)
export const getAuditLogs = ({
    url = "/api/audit-logs",
    search = "",
    action = "",
    modelName = "",
    page = 1,
} = {}) => {
    let requestUrl = url || "/api/audit-logs";
    
    // If the next or previous URL from the backend is fully qualified,
    // convert it to a relative path to keep the request through axiosSecure correct.
    if (requestUrl.startsWith("http://") || requestUrl.startsWith("https://")) {
        try {
            const parsedUrl = new URL(requestUrl);
            requestUrl = parsedUrl.pathname + parsedUrl.search;
        } catch (e) {
            console.error("Failed to parse paginated URL:", e);
        }
    }

    const params = {};
    
    // If requestUrl doesn't already have query parameters, build them
    if (!requestUrl.includes("?")) {
        if (search) params.search = search;
        if (action) params.action = action;
        if (modelName) params.model_name = modelName;
        if (page && page > 1) params.page = page;
    }

    return axiosSecure.get(requestUrl, { params });
};

// RETRIEVE OBJECT AUDIT TRAIL HISTORY
export const getObjectAuditLogs = (modelName, objectId) => {
    return axiosSecure.get(`/api/audit-logs/${modelName}/${objectId}`);
};

