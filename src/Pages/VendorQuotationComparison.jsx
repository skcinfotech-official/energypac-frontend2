import { useState } from "react";
import RequisitionFlowTab from "../components/vendorQuotation/RequisitionFlow";
import QuotationComparison from "../components/vendorQuotation/QuotationComparison";
import {
  Box,
  Card,
  Typography,
  Tab,
  Tabs,
} from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

export default function VendorQuotationComparison() {
  const [activeTab, setActiveTab] = useState("comparison");

  const tabs = [
    { id: "comparison", label: "Quotation Comparison", icon: <CompareArrowsIcon fontSize="small" /> },
    { id: "flow", label: "Quotation Flow", icon: <ShowChartIcon fontSize="small" /> },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* HEADER */}
      <Card
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 4,
          borderColor: "grey.200",
          boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "grey.800",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <ShowChartIcon sx={{ color: "primary.main" }} />
            Quotation Comparison & Flow
          </Typography>
          <Typography variant="caption" sx={{ color: "grey.500", fontWeight: 500 }}>
            Compare vendor quotes and track item requisition cycles
          </Typography>
        </Box>
      </Card>

      {/* TABS HEADER */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: "grey.200",
          boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
          px: 0.5,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 48,
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
              height: 2,
            },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              color: "grey.500",
              minHeight: 48,
              px: 3,
              py: 2,
              "&.Mui-selected": {
                color: "primary.main",
                fontWeight: 700,
              },
              "&:hover": {
                color: "grey.700",
                backgroundColor: "grey.50",
              },
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
            />
          ))}
        </Tabs>
      </Card>

      {/* TAB CONTENT */}
      <Box
        sx={{
          animation: "fadeSlideIn 300ms ease-out",
          "@keyframes fadeSlideIn": {
            from: { opacity: 0, transform: "translateY(8px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        {activeTab === "comparison" && <QuotationComparison />}
        {activeTab === "flow" && <RequisitionFlowTab />}
      </Box>
    </Box>
  );
}
