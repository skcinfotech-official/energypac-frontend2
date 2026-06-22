import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const baseTheme = createTheme({
    palette: {
        primary: {
            main: '#1565C0',
            light: '#1E88E5',
            dark: '#0D47A1',
            contrastText: '#fff',
        },
        secondary: {
            main: '#455A64',
            light: '#607D8B',
            dark: '#263238',
        },
        success: {
            main: '#2E7D32',
            light: '#4CAF50',
            dark: '#1B5E20',
        },
        warning: {
            main: '#E65100',
            light: '#FF9800',
            dark: '#BF360C',
        },
        error: {
            main: '#C62828',
            light: '#EF5350',
            dark: '#B71C1C',
        },
        info: {
            main: '#1565C0',
            light: '#42A5F5',
            dark: '#0D47A1',
        },
        background: {
            default: '#F5F7FA',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1E293B',
            secondary: '#64748B',
        },
        divider: '#E2E8F0',
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        h4: { fontWeight: 700, fontSize: '1.5rem' },
        h5: { fontWeight: 700, fontSize: '1.25rem' },
        h6: { fontWeight: 700, fontSize: '1rem' },
        subtitle1: { fontWeight: 600, fontSize: '0.875rem' },
        subtitle2: { fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
        body1: { fontSize: '0.875rem' },
        body2: { fontSize: '0.8125rem' },
        caption: { fontSize: '0.75rem', color: '#64748B' },
        button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: {
        borderRadius: 10,
    },
    shadows: [
        'none',
        '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        '0 2px 6px 0 rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.06)',
        '0 4px 12px 0 rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        '0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.06)',
        '0 8px 24px 0 rgba(0,0,0,0.09), 0 4px 8px -4px rgba(0,0,0,0.06)',
        ...Array(19).fill('0 10px 30px 0 rgba(0,0,0,0.1), 0 6px 12px -4px rgba(0,0,0,0.07)'),
    ],
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E1 transparent',
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
                },
                '*': {
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E1 transparent',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '8px 20px',
                    fontSize: '0.8125rem',
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' },
                },
                contained: {
                    '&:hover': { boxShadow: '0 2px 8px rgba(21,101,192,0.3)' },
                },
                sizeSmall: {
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                },
            },
            defaultProps: {
                disableElevation: true,
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                rounded: {
                    borderRadius: 12,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)',
                    '&:hover': {
                        boxShadow: '0 4px 12px 0 rgba(0,0,0,0.06)',
                    },
                    transition: 'box-shadow 0.2s ease',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #F1F5F9',
                    padding: '12px 16px',
                    fontSize: '0.8125rem',
                },
                head: {
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#64748B',
                    backgroundColor: '#F8FAFC',
                    borderBottom: '2px solid #E2E8F0',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: '#F8FAFC !important',
                    },
                    '&:nth-of-type(even)': {
                        backgroundColor: '#FAFBFC',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    fontSize: '0.6875rem',
                },
                sizeSmall: {
                    height: 22,
                    fontSize: '0.625rem',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        fontSize: '0.8125rem',
                        '& fieldset': { borderColor: '#E2E8F0' },
                        '&:hover fieldset': { borderColor: '#94A3B8' },
                        '&.Mui-focused fieldset': { borderColor: '#1565C0', borderWidth: 2 },
                    },
                    '& .MuiInputLabel-root': {
                        fontSize: '0.8125rem',
                    },
                },
            },
            defaultProps: {
                size: 'small',
                variant: 'outlined',
            },
        },
        MuiSelect: {
            defaultProps: {
                size: 'small',
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    fontSize: '1rem',
                    fontWeight: 700,
                    padding: '16px 24px',
                    borderBottom: '1px solid #E2E8F0',
                },
            },
        },
        MuiDialogContent: {
            styleOverrides: {
                root: {
                    padding: '20px 24px',
                },
            },
        },
        MuiDialogActions: {
            styleOverrides: {
                root: {
                    padding: '12px 24px',
                    borderTop: '1px solid #E2E8F0',
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: 6,
                    backgroundColor: '#1E293B',
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
                sizeSmall: {
                    padding: 6,
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: '1px solid #E2E8F0',
                    boxShadow: 'none',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    margin: '1px 8px',
                    padding: '8px 12px',
                    '&.Mui-selected': {
                        backgroundColor: '#EBF5FF',
                        color: '#1565C0',
                        '&:hover': { backgroundColor: '#DBEAFE' },
                        '& .MuiListItemIcon-root': { color: '#1565C0' },
                        '& .MuiListItemText-primary': { fontWeight: 700 },
                    },
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.8125rem',
                    minHeight: 42,
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    minHeight: 42,
                },
            },
        },
    },
});

// Add breakpoint-based scaling to the heading/text variants (h1–h6, subtitle,
// body, etc.). Combined with the fluid root font-size in index.css, this makes
// typography respond to screen size app-wide.
const theme = responsiveFontSizes(baseTheme, { factor: 2.2 });

export default theme;
