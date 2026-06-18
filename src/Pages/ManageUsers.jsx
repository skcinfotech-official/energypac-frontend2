import { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Grid,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ShieldIcon from "@mui/icons-material/Shield";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import WorkIcon from "@mui/icons-material/Work";
import CheckIcon from "@mui/icons-material/Check";
import LockIcon from "@mui/icons-material/Lock";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { adminService } from "../services/adminService";
import { toast } from "react-hot-toast";

const MODULES = [
  { id: "MASTER", label: "Master" },
  { id: "PURCHASE", label: "Purchase" },
  { id: "SALES", label: "Sales" },
  { id: "FINANCE", label: "Finance" },
  { id: "TRANSPORT", label: "Transport" },
  { id: "RETURNS", label: "Returns" },
];

const PRIMARY_COLOR = "#1565C0";
const BG_COLOR = "#FAFBFC";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    role: "",
    is_active: "",
    department: "",
    ordering: "",
    page: 1,
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    new_password: "",
  });

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    employee_code: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    role: "EMPLOYEE",
    password: "",
    permissions: MODULES.map((m) => ({
      module: m.id,
      module_label: m.label,
      can_read: true,
      can_write: false,
    })),
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        role: filters.role || undefined,
        is_active: filters.is_active || undefined,
        department: filters.department || undefined,
        ordering: filters.ordering || undefined,
        page: filters.page,
      };

      const data = await adminService.getUsers(params);

      // Handle paginated response structure
      if (data && Array.isArray(data.results)) {
        setUsers(data.results);
        setTotalCount(data.count);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotalCount(data.length);
      } else {
        setUsers([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      permissions:
        newRole === "ADMIN"
          ? MODULES.map((m) => ({
              module: m.id,
              module_label: m.label,
              can_read: true,
              can_write: true,
            }))
          : MODULES.map((m) => ({
              module: m.id,
              module_label: m.label,
              can_read: false,
              can_write: false,
            })),
    }));
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedUserId(null);
    setFormData({
      username: "",
      employee_code: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      department: "",
      role: "EMPLOYEE",
      password: "",
      permissions: MODULES.map((m) => ({
        module: m.id,
        module_label: m.label,
        can_read: false,
        can_write: false,
      })),
    });
    setIsModalOpen(true);
  };

  const handleEditClick = async (user) => {
    try {
      setLoading(true);
      const userData = await adminService.getUser(user.id);
      setIsEditMode(true);
      setSelectedUserId(user.id);
      setFormData({
        username: userData.username,
        employee_code: userData.employee_code,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone || "",
        department: userData.department || "",
        role: userData.role,
        password: "",
        permissions: MODULES.map((m) => {
          const existing = userData.permissions?.find((p) => p.module === m.id);
          return {
            module: m.id,
            module_label: m.label,
            can_read: existing ? existing.can_read : false,
            can_write: existing ? existing.can_write : false,
          };
        }),
      });
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch user details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (user) => {
    if (
      !window.confirm(
        `Are you sure you want to PERMANENTLY deactivate ${user.full_name}? This action cannot be undone from the UI.`
      )
    )
      return;

    try {
      setLoading(true);
      await adminService.deleteUser(user.id);
      toast.success(
        `User ${user.employee_code} has been permanently deactivated.`
      );
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to deactivate user"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.is_active ? "deactivate" : "activate";
    if (
      !window.confirm(
        `Are you sure you want to ${action} ${user.full_name}?`
      )
    )
      return;

    try {
      setLoading(true);
      const data = await adminService.toggleUserStatus(user.id);
      toast.success(
        data.message || `User ${user.employee_code} status updated.`
      );
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.error || `Failed to ${action} user`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordClick = (user) => {
    setSelectedUserId(user.id);
    setResetPasswordData({ new_password: "" });
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (resetPasswordData.new_password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      await adminService.resetPassword(selectedUserId, resetPasswordData);
      toast.success("Password reset successfully");
      setIsResetPasswordModalOpen(false);
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (module) => {
    if (formData.role === "ADMIN") return;

    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) => {
        if (p.module === module) {
          const newValue = !p.can_read;
          return { ...p, can_read: newValue, can_write: newValue };
        }
        return p;
      }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Manual Validation for Mandatory Fields
    const mandatoryFields = isEditMode
      ? [
          "username",
          "employee_code",
          "email",
          "first_name",
          "last_name",
          "phone",
          "department",
          "role",
        ]
      : [
          "username",
          "employee_code",
          "email",
          "first_name",
          "last_name",
          "phone",
          "department",
          "role",
          "password",
        ];

    const missingFields = mandatoryFields.filter(
      (field) => !formData[field]
    );

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in all mandatory fields: ${missingFields
          .join(", ")
          .replace(/_/g, " ")}`
      );
      return;
    }

    try {
      setLoading(true);
      if (isEditMode) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await adminService.updateUser(selectedUserId, updateData);
        toast.success("User updated successfully!");
      } else {
        await adminService.createUser(formData);
        toast.success("User created successfully!");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          error.message ||
          "Operation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#1e293b", letterSpacing: "-0.02em" }}
          >
            User Management
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Manage system access, roles, and module permissions.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={openCreateModal}
          sx={{
            bgcolor: PRIMARY_COLOR,
            "&:hover": { bgcolor: "#1976D2" },
            borderRadius: 4,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            textTransform: "none",
            boxShadow: "0 4px 14px rgba(21,101,192,0.3)",
          }}
        >
          Create New User
        </Button>
      </Box>

      {/* FILTERS & SEARCH */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by code, name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 4,
                bgcolor: "#fff",
                "&:hover fieldset": { borderColor: PRIMARY_COLOR },
                "&.Mui-focused fieldset": { borderColor: PRIMARY_COLOR },
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select
              value={filters.role}
              label="Role"
              onChange={(e) =>
                setFilters({ ...filters, role: e.target.value, page: 1 })
              }
              sx={{ borderRadius: 4, bgcolor: "#fff" }}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="EMPLOYEE">Employee</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Department</InputLabel>
            <Select
              value={filters.department}
              label="Department"
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value, page: 1 })
              }
              sx={{ borderRadius: 4, bgcolor: "#fff" }}
            >
              <MenuItem value="">All Departments</MenuItem>
              <MenuItem value="Purchase">Purchase</MenuItem>
              <MenuItem value="Sales">Sales</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="Master">Master</MenuItem>
              <MenuItem value="Management">Management</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.is_active}
              label="Status"
              onChange={(e) =>
                setFilters({ ...filters, is_active: e.target.value, page: 1 })
              }
              sx={{ borderRadius: 4, bgcolor: "#fff" }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 6, md: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
            onClick={() => {
              setSearchTerm("");
              setFilters({
                role: "",
                is_active: "",
                department: "",
                ordering: "",
                page: 1,
              });
            }}
            sx={{
              borderRadius: 4,
              borderColor: "#e2e8f0",
              color: "#64748b",
              bgcolor: "#fff",
              textTransform: "none",
              height: "100%",
              "&:hover": {
                borderColor: "#cbd5e1",
                bgcolor: "#f8fafc",
                color: "#1e293b",
              },
            }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>

      {/* USERS TABLE */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          borderColor: "#e2e8f0",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  User Details
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Department
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Role
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Created At
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <CircularProgress size={32} sx={{ color: PRIMARY_COLOR }} />
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        Loading Users...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 8, color: "#64748b", fontStyle: "italic" }}
                  >
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                Array.isArray(users) &&
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{
                      "&:hover": { bgcolor: "rgba(248,250,252,0.8)" },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                          sx={{
                            height: 40,
                            width: 40,
                            borderRadius: 2,
                            bgcolor: "rgba(21,101,192,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: PRIMARY_COLOR,
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            border: "1px solid rgba(21,101,192,0.15)",
                          }}
                        >
                          {user.first_name[0]}
                          {user.last_name[0]}
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: "#1e293b" }}
                          >
                            {user.full_name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#64748b", fontWeight: 500 }}
                          >
                            {user.employee_code} &bull; {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          color: "#334155",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                        }}
                      >
                        <WorkIcon sx={{ color: "#94a3b8", fontSize: 16 }} />
                        <Typography variant="body2">
                          {user.department || "N/A"}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                          ...(user.role === "ADMIN"
                            ? {
                                bgcolor: "rgba(21,101,192,0.1)",
                                color: PRIMARY_COLOR,
                                border: "1px solid rgba(21,101,192,0.25)",
                              }
                            : {
                                bgcolor: "rgba(33,150,243,0.1)",
                                color: "#1e88e5",
                                border: "1px solid rgba(33,150,243,0.25)",
                              }),
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                      >
                        <Box
                          sx={{
                            height: 8,
                            width: 8,
                            borderRadius: "50%",
                            bgcolor: user.is_active ? "#10b981" : "#ef4444",
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 500,
                            color: user.is_active ? "#10b981" : "#ef4444",
                          }}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(user)}
                            sx={{
                              color: PRIMARY_COLOR,
                              "&:hover": {
                                bgcolor: "rgba(21,101,192,0.08)",
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Reset Password">
                          <IconButton
                            size="small"
                            onClick={() => handleResetPasswordClick(user)}
                            sx={{
                              color: "#f59e0b",
                              "&:hover": {
                                bgcolor: "rgba(245,158,11,0.08)",
                              },
                            }}
                          >
                            <VpnKeyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip
                          title={
                            user.is_active
                              ? "Deactivate User"
                              : "Activate User"
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(user)}
                            sx={{
                              color: user.is_active ? "#3b82f6" : "#10b981",
                              "&:hover": {
                                bgcolor: user.is_active
                                  ? "rgba(59,130,246,0.08)"
                                  : "rgba(16,185,129,0.08)",
                              },
                            }}
                          >
                            <PowerSettingsNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Permanent Deactivate">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(user)}
                            sx={{
                              color: "#ef4444",
                              "&:hover": {
                                bgcolor: "rgba(239,68,68,0.08)",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 1,
              px: 3,
              py: 2,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <Typography variant="caption" sx={{ color: "#64748b", mr: 1 }}>
              Page {filters.page} of {totalPages} ({totalCount} users)
            </Typography>
            <Button
              size="small"
              variant="outlined"
              disabled={filters.page <= 1}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              sx={{
                minWidth: 36,
                borderRadius: 2,
                borderColor: "#e2e8f0",
                color: "#64748b",
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={filters.page >= totalPages}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              sx={{
                minWidth: 36,
                borderRadius: 2,
                borderColor: "#e2e8f0",
                color: "#64748b",
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </Button>
          </Box>
        )}
      </Card>

      {/* CREATE / EDIT USER MODAL */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "#fff",
            borderBottom: "1px solid #e2e8f0",
            px: 4,
            py: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: PRIMARY_COLOR,
                borderRadius: 3,
                color: "#fff",
                display: "flex",
                boxShadow: "0 4px 14px rgba(21,101,192,0.3)",
              }}
            >
              {isEditMode ? (
                <ManageAccountsIcon sx={{ fontSize: 24 }} />
              ) : (
                <PersonAddIcon sx={{ fontSize: 24 }} />
              )}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
                {isEditMode ? "Update User Profile" : "Initialize New Employee"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                {isEditMode
                  ? "Modify Account Settings"
                  : "System Access Configuration"}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setIsModalOpen(false)}
            sx={{ color: "#94a3b8" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent
            sx={{
              px: 4,
              py: 4,
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <Grid container spacing={4}>
              {/* LEFT COLUMN - Personal Information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: PRIMARY_COLOR,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.2em",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        height: 4,
                        width: 16,
                        bgcolor: PRIMARY_COLOR,
                        borderRadius: 2,
                      }}
                    />
                    Personal Information
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="First Name *"
                        required
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({ ...formData, first_name: e.target.value })
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: "rgba(33,150,243,0.03)",
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Last Name *"
                        required
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData({ ...formData, last_name: e.target.value })
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: "rgba(33,150,243,0.03)",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    size="small"
                    label="Email Address *"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: "#64748b", fontSize: 18 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: BG_COLOR,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Phone Number *"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon sx={{ color: "#64748b", fontSize: 18 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: BG_COLOR,
                      },
                    }}
                  />
                </Box>
              </Grid>

              {/* RIGHT COLUMN - Employment Details */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: PRIMARY_COLOR,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.2em",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        height: 4,
                        width: 16,
                        bgcolor: PRIMARY_COLOR,
                        borderRadius: 2,
                      }}
                    />
                    Employment Details
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Username *"
                        required
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: BG_COLOR,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Employee Code *"
                        required
                        value={formData.employee_code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            employee_code: e.target.value,
                          })
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: BG_COLOR,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  <FormControl fullWidth size="small">
                    <InputLabel>Department *</InputLabel>
                    <Select
                      required
                      value={formData.department}
                      label="Department *"
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      sx={{ borderRadius: 2, bgcolor: BG_COLOR }}
                    >
                      <MenuItem value="">Select Dept</MenuItem>
                      <MenuItem value="Purchase">Purchase</MenuItem>
                      <MenuItem value="Sales">Sales</MenuItem>
                      <MenuItem value="Finance">Finance</MenuItem>
                      <MenuItem value="Master">Master</MenuItem>
                      <MenuItem value="Management">Management</MenuItem>
                    </Select>
                  </FormControl>

                  {/* System Role Toggle */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        ml: 0.5,
                      }}
                    >
                      System Role *
                    </Typography>
                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                      <Grid size={6}>
                        <Button
                          fullWidth
                          variant={
                            formData.role === "EMPLOYEE"
                              ? "contained"
                              : "outlined"
                          }
                          startIcon={<ManageAccountsIcon />}
                          onClick={() =>
                            handleRoleChange({ target: { value: "EMPLOYEE" } })
                          }
                          sx={{
                            borderRadius: 2,
                            py: 1.2,
                            fontWeight: 700,
                            textTransform: "none",
                            ...(formData.role === "EMPLOYEE"
                              ? {
                                  bgcolor: PRIMARY_COLOR,
                                  "&:hover": { bgcolor: "#1976D2" },
                                  boxShadow:
                                    "0 4px 14px rgba(21,101,192,0.3)",
                                }
                              : {
                                  borderColor: "#e2e8f0",
                                  color: "#64748b",
                                  bgcolor: BG_COLOR,
                                  "&:hover": { borderColor: "#cbd5e1" },
                                }),
                          }}
                        >
                          Employee
                        </Button>
                      </Grid>
                      <Grid size={6}>
                        <Button
                          fullWidth
                          variant={
                            formData.role === "ADMIN" ? "contained" : "outlined"
                          }
                          startIcon={<ShieldIcon />}
                          onClick={() =>
                            handleRoleChange({ target: { value: "ADMIN" } })
                          }
                          sx={{
                            borderRadius: 2,
                            py: 1.2,
                            fontWeight: 700,
                            textTransform: "none",
                            ...(formData.role === "ADMIN"
                              ? {
                                  bgcolor: PRIMARY_COLOR,
                                  "&:hover": { bgcolor: "#1976D2" },
                                  boxShadow:
                                    "0 4px 14px rgba(21,101,192,0.3)",
                                }
                              : {
                                  borderColor: "#e2e8f0",
                                  color: "#64748b",
                                  bgcolor: BG_COLOR,
                                  "&:hover": { borderColor: "#cbd5e1" },
                                }),
                          }}
                        >
                          Admin
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Password field (only in create mode) */}
                  {!isEditMode && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Access Password *"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon
                                sx={{ color: "#64748b", fontSize: 18 }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? (
                                  <VisibilityOffIcon
                                    sx={{ fontSize: 18, color: "#94a3b8" }}
                                  />
                                ) : (
                                  <VisibilityIcon
                                    sx={{ fontSize: 18, color: "#94a3b8" }}
                                  />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: BG_COLOR,
                        },
                      }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* MODULE PERMISSIONS */}
            <Box sx={{ mt: 6 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 3,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: PRIMARY_COLOR,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      height: 4,
                      width: 16,
                      bgcolor: PRIMARY_COLOR,
                      borderRadius: 2,
                    }}
                  />
                  Module Permissions
                </Typography>
                {formData.role === "ADMIN" && (
                  <Chip
                    label="Auto-Assigned"
                    size="small"
                    sx={{
                      ml: 2,
                      fontSize: "0.6rem",
                      height: 22,
                      bgcolor: "rgba(21,101,192,0.08)",
                      color: PRIMARY_COLOR,
                      border: "1px solid rgba(21,101,192,0.2)",
                    }}
                  />
                )}
              </Box>

              <Grid container spacing={2}>
                {MODULES.map((module) => {
                  const perm = formData.permissions.find(
                    (p) => p.module === module.id
                  );
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={module.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          borderColor:
                            formData.role === "ADMIN"
                              ? "rgba(21,101,192,0.25)"
                              : "#e2e8f0",
                          bgcolor:
                            formData.role === "ADMIN"
                              ? "rgba(21,101,192,0.04)"
                              : BG_COLOR,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: "#1e293b",
                            mb: 2,
                          }}
                        >
                          {module.label}
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              textTransform: "uppercase",
                              fontWeight: 700,
                              color: "#64748b",
                              fontSize: "0.6rem",
                            }}
                          >
                            Access Control
                          </Typography>
                          <Switch
                            size="small"
                            disabled={formData.role === "ADMIN"}
                            checked={perm?.can_read || false}
                            onChange={() =>
                              handlePermissionChange(module.id)
                            }
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: PRIMARY_COLOR,
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                {
                                  bgcolor: PRIMARY_COLOR,
                                },
                            }}
                          />
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </DialogContent>

          {/* ACTION BUTTONS */}
          <DialogActions
            sx={{
              px: 4,
              py: 3,
              borderTop: "1px solid #e2e8f0",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              onClick={() => setIsModalOpen(false)}
              sx={{
                color: "#94a3b8",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                "&:hover": { color: "#64748b" },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={16} sx={{ color: "#fff" }} />
                ) : isEditMode ? (
                  <ManageAccountsIcon />
                ) : (
                  <PersonAddIcon />
                )
              }
              sx={{
                bgcolor: PRIMARY_COLOR,
                "&:hover": { bgcolor: "#1976D2" },
                borderRadius: 3,
                px: 4,
                py: 1,
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                boxShadow: "0 4px 14px rgba(21,101,192,0.3)",
              }}
            >
              {loading
                ? "Processing..."
                : isEditMode
                ? "Update User"
                : "Create User"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* RESET PASSWORD MODAL */}
      <Dialog
        open={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #e2e8f0",
            px: 4,
            py: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: "#f59e0b",
                borderRadius: 3,
                color: "#fff",
                display: "flex",
                boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
              }}
            >
              <VpnKeyIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
                Reset Password
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                Secure Credentials Update
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setIsResetPasswordModalOpen(false)}
            sx={{ color: "#94a3b8" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleResetPasswordSubmit}>
          <DialogContent sx={{ px: 4, py: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="New Password *"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Minimum 6 characters"
              value={resetPasswordData.new_password}
              onChange={(e) =>
                setResetPasswordData({ new_password: e.target.value })
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "#64748b", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOffIcon
                            sx={{ fontSize: 18, color: "#94a3b8" }}
                          />
                        ) : (
                          <VisibilityIcon
                            sx={{ fontSize: 18, color: "#94a3b8" }}
                          />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: BG_COLOR,
                },
              }}
            />
          </DialogContent>

          <DialogActions
            sx={{
              px: 4,
              py: 2.5,
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              onClick={() => setIsResetPasswordModalOpen(false)}
              sx={{
                color: "#94a3b8",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                "&:hover": { color: "#64748b" },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={16} sx={{ color: "#fff" }} />
                ) : (
                  <CheckIcon />
                )
              }
              sx={{
                bgcolor: "#f59e0b",
                "&:hover": { bgcolor: "#d97706" },
                borderRadius: 2,
                px: 3,
                py: 0.8,
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
              }}
            >
              {loading ? "Saving..." : "Reset"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
