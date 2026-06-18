
import { useState } from "react";
import {
    Box, Card, Typography, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, InputAdornment
} from "@mui/material";
import {
    Add as AddIcon, Search as SearchIcon,
    ChevronLeft as PrevIcon, ChevronRight as NextIcon,
} from "@mui/icons-material";

const DirectPurchase = () => {
    const [searchText, setSearchText] = useState("");

    return (
        <Box>
            <Card>
                {/* Header */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Direct Purchase</Typography>
                        <Typography variant="caption" color="text.secondary">Total: 0</Typography>
                    </Box>
                    <Button size="small" variant="contained" startIcon={<AddIcon />}>
                        New Direct Purchase
                    </Button>
                </Box>

                {/* Search */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FAFBFC' }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Search direct purchase..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Table */}
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Vendor</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body2" color="text.secondary">No data found</Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Button size="small" startIcon={<PrevIcon />} disabled sx={{ fontWeight: 600 }}>Previous</Button>
                    <Button size="small" endIcon={<NextIcon />} disabled sx={{ fontWeight: 600 }}>Next</Button>
                </Box>
            </Card>
        </Box>
    );
};

export default DirectPurchase;
