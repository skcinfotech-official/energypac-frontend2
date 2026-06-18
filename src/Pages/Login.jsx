import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Box, Paper, TextField, Button, Typography, InputAdornment,
    IconButton, Alert, CircularProgress
} from "@mui/material";
import {
    Person as PersonIcon,
    Lock as LockIcon,
    Visibility as ShowIcon,
    VisibilityOff as HideIcon,
    ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import ForgotPasswordModal from "../components/common/ForgotPasswordModal";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login() {
    const [employeeCode, setEmployeeCode] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

    const navigate = useNavigate();
    const { login, isAuthenticated, user, authChecked } = useAuth();

    useEffect(() => {
        if (authChecked && isAuthenticated) {
            if (user?.role === "ADMIN") {
                navigate("/admin/users", { replace: true });
            } else {
                navigate("/", { replace: true });
            }
        }
    }, [isAuthenticated, authChecked, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            setLoading(true);
            const user = await login(employeeCode, password);
            if (user?.role === "ADMIN") {
                navigate("/admin/users", { replace: true });
            } else {
                navigate("/", { replace: true });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh', bgcolor: '#F0F4F8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            p: 3, position: 'relative', overflow: 'hidden',
        }}>
            {/* Decorative bg */}
            <Box sx={{
                position: 'absolute', top: -200, right: -200,
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(21,101,192,0.08) 0%, transparent 70%)',
            }} />
            <Box sx={{
                position: 'absolute', bottom: -200, left: -200,
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(21,101,192,0.05) 0%, transparent 70%)',
            }} />

            <Box sx={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Box component="img" src="/main_logo.png" alt="Energypac Logo"
                        sx={{ height: 72, mx: 'auto', mb: 2, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        Developed By{' '}
                        <Typography component={Link} to="https://skcinfotech.in/" target="_blank"
                            sx={{ color: 'primary.main', fontWeight: 800, fontSize: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            SKC INFOTECH
                        </Typography>
                    </Typography>
                    <Typography variant="caption" sx={{
                        display: 'inline-block', mt: 2, px: 2, py: 0.75,
                        border: '1px solid', borderColor: 'divider', borderRadius: 5,
                        bgcolor: 'rgba(255,255,255,0.7)', fontWeight: 700,
                        letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.6rem',
                    }}>
                        Authorized Access Only
                    </Typography>
                </Box>

                {/* Login Card */}
                <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                fullWidth
                                placeholder="Employee Code"
                                autoComplete="username"
                                value={employeeCode}
                                onChange={e => setEmployeeCode(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3, bgcolor: '#F8FAFC',
                                        '& fieldset': { borderColor: '#E8EDF2' },
                                    },
                                }}
                            />

                            <TextField
                                fullWidth
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    size="small"
                                                    aria-label="toggle password visibility"
                                                    sx={{ color: '#475569', mr: 0.5 }}
                                                >
                                                    {showPassword ? <HideIcon fontSize="small" /> : <ShowIcon fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3, bgcolor: '#F8FAFC',
                                        '& fieldset': { borderColor: '#E8EDF2' },
                                    },
                                }}
                            />

                            {error && (
                                <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.8rem', fontWeight: 600 }}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={loading}
                                size="large"
                                endIcon={!loading && <ChevronRightIcon />}
                                sx={{
                                    py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: '0.9rem',
                                    boxShadow: '0 4px 14px rgba(21,101,192,0.3)',
                                    '&:hover': { boxShadow: '0 6px 20px rgba(21,101,192,0.4)' },
                                }}
                            >
                                {loading ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={20} color="inherit" />
                                        Signing In...
                                    </Box>
                                ) : "Log In"}
                            </Button>
                        </Box>
                    </form>

                    <Box sx={{
                        mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.secondary', fontSize: '0.6rem' }}>
                            Corporate Enterprise
                        </Typography>
                        <Button
                            size="small"
                            onClick={() => setIsForgotModalOpen(true)}
                            sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none' }}
                        >
                            Forgot Password?
                        </Button>
                    </Box>
                </Paper>

                <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />

                <Typography variant="caption" sx={{
                    display: 'block', textAlign: 'center', mt: 4,
                    color: 'text.secondary', letterSpacing: '0.15em',
                    textTransform: 'uppercase', fontSize: '0.55rem', fontWeight: 600,
                }}>
                    &copy; 2026 Energypac Engineering Ltd.
                </Typography>
            </Box>
        </Box>
    );
}
