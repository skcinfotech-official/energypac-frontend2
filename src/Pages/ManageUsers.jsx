import { useState, useEffect } from "react";
import { 
  FaUserPlus, 
  FaSearch, 
  FaFilter, 
  FaEllipsisV, 
  FaShieldAlt, 
  FaEnvelope, 
  FaPhone, 
  FaBriefcase,
  FaTimes,
  FaCheck,
  FaLock,
  FaUserCog,
  FaEdit,
  FaTrashAlt,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaPowerOff
} from "react-icons/fa";
import { adminService } from "../services/adminService";
import { toast } from "react-hot-toast";

const MODULES = [
  { id: "MASTER", label: "Master" },
  { id: "PURCHASE", label: "Purchase" },
  { id: "SALES", label: "Sales" },
  { id: "FINANCE", label: "Finance" },
];

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
    page: 1
  });
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    new_password: ""
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
    permissions: MODULES.map(m => ({ module: m.id, can_read: true, can_write: false }))
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
        page: filters.page
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
    setFormData(prev => ({
      ...prev,
      role: newRole,
      // If Admin, auto-set all permissions to true. If Employee, keep existing or reset.
      permissions: newRole === "ADMIN" 
        ? MODULES.map(m => ({ module: m.id, can_read: true, can_write: true }))
        : MODULES.map(m => ({ module: m.id, can_read: true, can_write: false }))
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
      permissions: MODULES.map(m => ({ module: m.id, can_read: true, can_write: false }))
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
        password: "", // Password is optional on update
        permissions: userData.permissions && userData.permissions.length > 0 
          ? userData.permissions 
          : MODULES.map(m => ({ module: m.id, can_read: true, can_write: false }))
      });
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch user details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (user) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY deactivate ${user.full_name}? This action cannot be undone from the UI.`)) return;
    
    try {
      setLoading(true);
      await adminService.deleteUser(user.id);
      toast.success(`User ${user.employee_code} has been permanently deactivated.`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to deactivate user");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.is_active ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.full_name}?`)) return;

    try {
      setLoading(true);
      const data = await adminService.toggleUserStatus(user.id);
      toast.success(data.message || `User ${user.employee_code} status updated.`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${action} user`);
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
      toast.error(error.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (module) => {
    if (formData.role === "ADMIN") return;

    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => {
        if (p.module === module) {
          const newValue = !p.can_read;
          return { ...p, can_read: newValue, can_write: newValue };
        }
        return p;
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Manual Validation for Mandatory Fields
    const mandatoryFields = isEditMode 
      ? ['username', 'employee_code', 'email', 'first_name', 'last_name', 'phone', 'department', 'role']
      : ['username', 'employee_code', 'email', 'first_name', 'last_name', 'phone', 'department', 'role', 'password'];
    
    const missingFields = mandatoryFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all mandatory fields: ${missingFields.join(', ').replace(/_/g, ' ')}`);
      return;
    }

    try {
      setLoading(true);
      if (isEditMode) {
        // For update, if password is empty, don't send it
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
      toast.error(error.response?.data?.detail || error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">User Management</h2>
          <p className="text-slate-400">Manage system access, roles, and module permissions.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all font-semibold"
        >
          <FaUserPlus />
          <span>Create New User</span>
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="md:col-span-2 relative group">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by code, name, email..."
            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-300 px-4 py-3 text-sm focus:border-indigo-500 outline-none"
          value={filters.role}
          onChange={(e) => setFilters({...filters, role: e.target.value, page: 1})}
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="EMPLOYEE">Employee</option>
        </select>

        <select 
          className="bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-300 px-4 py-3 text-sm focus:border-indigo-500 outline-none"
          value={filters.department}
          onChange={(e) => setFilters({...filters, department: e.target.value, page: 1})}
        >
          <option value="">All Departments</option>
          <option value="Purchase">Purchase</option>
          <option value="Sales">Sales</option>
          <option value="Finance">Finance</option>
          <option value="Master">Master</option>
          <option value="Management">Management</option>
        </select>

        <select 
          className="bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-300 px-4 py-3 text-sm focus:border-indigo-500 outline-none"
          value={filters.is_active}
          onChange={(e) => setFilters({...filters, is_active: e.target.value, page: 1})}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button 
          onClick={() => {
            setSearchTerm("");
            setFilters({ role: "", is_active: "", department: "", ordering: "", page: 1 });
          }}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-sm"
        >
          <FaTimes className="text-xs" />
          <span>Reset</span>
        </button>
      </div>

      {/* USERS TABLE */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Created At</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading Users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 italic">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                Array.isArray(users) && users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm group-hover:text-indigo-400 transition-colors">{user.full_name}</p>
                          <p className="text-slate-500 text-xs">{user.employee_code} • {user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <FaBriefcase className="text-slate-500 text-xs" />
                        <span>{user.department || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                        user.role === 'ADMIN' 
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className={`text-xs font-medium ${user.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditClick(user)}
                          title="Edit User"
                          className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-600/20 rounded-lg transition-all"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleResetPasswordClick(user)}
                          title="Reset Password"
                          className="p-2 text-amber-400 hover:text-white hover:bg-amber-600/20 rounded-lg transition-all"
                        >
                          <FaKey />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          title={user.is_active ? "Deactivate User" : "Activate User"}
                          className={`p-2 rounded-lg transition-all ${
                            user.is_active 
                              ? "text-blue-400 hover:text-white hover:bg-blue-600/20" 
                              : "text-emerald-400 hover:text-white hover:bg-emerald-600/20"
                          }`}
                        >
                          <FaPowerOff />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(user)}
                          title="Permanent Deactivate"
                          className="p-2 text-red-400 hover:text-white hover:bg-red-600/20 rounded-lg transition-all"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* MODAL HEADER */}
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 sticky top-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                  {isEditMode ? <FaUserCog className="text-xl" /> : <FaUserPlus className="text-xl" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{isEditMode ? "Update User Profile" : "Initialize New Employee"}</h3>
                  <p className="text-slate-500 text-xs uppercase tracking-widest mt-0.5">{isEditMode ? "Modify Account Settings" : "System Access Configuration"}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <FaTimes />
              </button>
            </div>

            {/* MODAL BODY */}
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[70vh] no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PRIMARY INFO */}
                <div className="space-y-6">
                  <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="h-1 w-4 bg-indigo-600 rounded-full"></span>
                    Personal Information
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">First Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">Last Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">Email Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input 
                        type="email" 
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">Phone Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input 
                        type="tel" 
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* EMPLOYMENT INFO */}
                <div className="space-y-6">
                  <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="h-1 w-4 bg-indigo-600 rounded-full"></span>
                    Employment Details
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">Username <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">Employee Code <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.employee_code}
                        onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">Department <span className="text-red-500">*</span></label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    >
                      <option value="" className="bg-slate-900">Select Dept</option>
                      <option value="Purchase" className="bg-slate-900">Purchase</option>
                      <option value="Sales" className="bg-slate-900">Sales</option>
                      <option value="Finance" className="bg-slate-900">Finance</option>
                      <option value="Master" className="bg-slate-900">Master</option>
                      <option value="Management" className="bg-slate-900">Management</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">System Role <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRoleChange({ target: { value: "EMPLOYEE" } })}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                          formData.role === "EMPLOYEE" 
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                            : "bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        <FaUserCog />
                        Employee
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoleChange({ target: { value: "ADMIN" } })}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                          formData.role === "ADMIN" 
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                            : "bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        <FaShieldAlt />
                        Admin
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">Access Password {!isEditMode && <span className="text-red-500">*</span>}</label>
                    <div className="relative">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required={!isEditMode}
                        placeholder={isEditMode ? "Leave blank to keep current" : "••••••••"}
                        className="w-full pl-11 pr-12 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* MODULE PERMISSIONS */}
              <div className="mt-12 space-y-6">
                <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="h-1 w-4 bg-indigo-600 rounded-full"></span>
                  Module Permissions
                  {formData.role === "ADMIN" && (
                    <span className="ml-4 text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">Auto-Assigned</span>
                  )}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {MODULES.map((module) => {
                    const perm = formData.permissions.find(p => p.module === module.id);
                    return (
                      <div key={module.id} className={`p-4 border rounded-2xl transition-all ${
                        formData.role === "ADMIN" 
                          ? "bg-indigo-600/5 border-indigo-500/20" 
                          : "bg-slate-950/50 border-slate-800"
                      }`}>
                        <p className="text-white text-sm font-bold mb-4">{module.label}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Access Control</span>
                          <label className="relative inline-flex items-center cursor-pointer group">
                            <input 
                              type="checkbox"
                              disabled={formData.role === "ADMIN"}
                              checked={perm?.can_read && perm?.can_write}
                              onChange={() => handlePermissionChange(module.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-12 pt-8 border-t border-slate-800 flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 rounded-2xl text-slate-400 font-bold hover:text-white transition-all uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20 transition-all font-bold uppercase text-xs tracking-widest flex items-center gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : isEditMode ? <FaUserCog /> : <FaUserPlus />}
                  {loading ? "Processing..." : isEditMode ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsResetPasswordModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-600 rounded-2xl text-white shadow-lg shadow-amber-500/20">
                  <FaKey className="text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Reset Password</h3>
                  <p className="text-slate-500 text-xs uppercase tracking-widest mt-0.5">Secure Credentials Update</p>
                </div>
              </div>
              <button 
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-slate-500 text-[10px] font-bold uppercase ml-1">New Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="Minimum 6 characters"
                    className="w-full pl-11 pr-12 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
                    value={resetPasswordData.new_password}
                    onChange={(e) => setResetPasswordData({ new_password: e.target.value })}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-6 py-2 rounded-xl text-slate-400 font-bold hover:text-white transition-all uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20 transition-all font-bold uppercase text-xs tracking-widest flex items-center gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : <FaCheck />}
                  {loading ? "Saving..." : "Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
