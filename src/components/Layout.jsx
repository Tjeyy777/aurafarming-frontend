import React from "react";
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, Tooltip, useTheme, Avatar, Divider, Collapse,
} from "@mui/material";

import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventNoteIcon from "@mui/icons-material/EventNote";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PeopleIcon from "@mui/icons-material/People";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import GroupsIcon from "@mui/icons-material/Groups";
import ScaleIcon from "@mui/icons-material/Scale";
import WarningIcon from "@mui/icons-material/WarningAmberRounded";
import Brightness4Icon from "@mui/icons-material/DarkModeOutlined";
import Brightness7Icon from "@mui/icons-material/LightModeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useAuthStore } from "../store/useAuthStore";

const drawerWidth = 264;

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon fontSize="small" />, section: "overview", adminOnly: true },
  { text: "Employees", icon: <PeopleIcon fontSize="small" />, section: "operations" },
  { text: "Attendance", icon: <EventNoteIcon fontSize="small" />, section: "operations" },
  { text: "Weighbridge", icon: <ScaleIcon fontSize="small" />, section: "operations" },
  { text: "Explosives", icon: <WarningIcon fontSize="small" />, section: "resources" },
  { text: "Consumables", icon: <InventoryIcon fontSize="small" />, section: "resources" },
  { text: "Machinery", icon: <PrecisionManufacturingIcon fontSize="small" />, section: "resources" },
  {
    text: "Rented Module",
    icon: <LocalShippingIcon fontSize="small" />,
    section: "resources",
    subItems: [
      { text: "Rented Logs", icon: <HistoryIcon sx={{ fontSize: 16 }} /> },
      { text: "Add Rented Vehicle", icon: <AddCircleOutlineIcon sx={{ fontSize: 16 }} /> },
    ],
  },
  { text: "Diesel", icon: <LocalGasStationIcon fontSize="small" />, section: "resources" },
  { text: "Expenses", icon: <AccountBalanceWalletIcon fontSize="small" />, section: "finance" },
  { text: "Team Management", icon: <GroupsIcon fontSize="small" />, section: "admin", adminOnly: true },
];

const sections = [
  { key: "overview", label: "Overview" },
  { key: "operations", label: "Operations" },
  { key: "resources", label: "Resources" },
  { key: "finance", label: "Finance" },
  { key: "admin", label: "Admin" },
];

export default function Layout({ children, onNavigate, currentPage, onToggleTheme, onLogout, onGenerateReport }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [openMenus, setOpenMenus] = React.useState({ "Rented Module": true });

  const visibleMenuItems = menuItems.filter((item) => !(item.adminOnly && !isAdmin));

  const handleMenuClick = (text) => setOpenMenus((prev) => ({ ...prev, [text]: !prev[text] }));

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "background.paper",
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {/* Brand */}
        <Box sx={{ px: 2.5, py: 2.25, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 30, height: 30, borderRadius: "7px",
                bgcolor: "primary.main", color: "primary.contrastText",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "0.9rem",
              }}
            >
              A
            </Box>
            <Box>
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.15 }}>
                Aura Farming
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", lineHeight: 1.15 }}>
                Operations
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* User */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Box
            sx={{
              p: 1.25, borderRadius: "8px",
              bgcolor: "surface2",
              border: `1px solid ${theme.palette.divider}`,
              display: "flex", alignItems: "center", gap: 1.25,
            }}
          >
            <Avatar sx={{ width: 30, height: 30, fontSize: "0.8rem", bgcolor: "primary.main", color: "primary.contrastText" }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{user?.name}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "capitalize" }}>
                {user?.role}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Nav */}
        <Box sx={{ px: 1.5, py: 2, flex: 1, overflowY: "auto" }}>
          {sections.map((section) => {
            const sectionItems = visibleMenuItems.filter((m) => m.section === section.key);
            if (sectionItems.length === 0) return null;
            return (
              <Box key={section.key} sx={{ mb: 1.5 }}>
                <Typography
                  variant="overline"
                  sx={{ color: "text.disabled", px: 1.25, mb: 0.5, display: "block", letterSpacing: "0.06em" }}
                >
                  {section.label}
                </Typography>
                <List disablePadding>
                  {sectionItems.map((item) => {
                    const isSelected = currentPage === item.text;
                    const hasSubItems = item.subItems?.length > 0;
                    const isOpen = openMenus[item.text];
                    const anySubActive = hasSubItems && item.subItems.some((s) => s.text === currentPage);

                    return (
                      <React.Fragment key={item.text}>
                        <ListItemButton
                          onClick={hasSubItems ? () => handleMenuClick(item.text) : () => onNavigate(item.text)}
                          selected={isSelected}
                          sx={{ mb: 0.25, py: 0.75 }}
                        >
                          <ListItemIcon
                            sx={{ minWidth: 32, color: isSelected || anySubActive ? "primary.main" : "text.secondary" }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontSize: "0.8125rem",
                              color: isSelected ? "text.primary" : "text.secondary",
                              fontWeight: isSelected ? 600 : 500,
                            }}
                          />
                          {hasSubItems && (isOpen ? <ExpandLess sx={{ fontSize: 18, color: "text.disabled" }} /> : <ExpandMore sx={{ fontSize: 18, color: "text.disabled" }} />)}
                        </ListItemButton>

                        {hasSubItems && (
                          <Collapse in={isOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding sx={{ pl: 2.5 }}>
                              {item.subItems.map((sub) => {
                                const isSubSelected = currentPage === sub.text;
                                return (
                                  <ListItemButton
                                    key={sub.text}
                                    onClick={() => onNavigate(sub.text)}
                                    selected={isSubSelected}
                                    sx={{ mb: 0.25, py: 0.6 }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 28, color: isSubSelected ? "primary.main" : "text.secondary" }}>
                                      {sub.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={sub.text}
                                      primaryTypographyProps={{
                                        fontSize: "0.8125rem",
                                        color: isSubSelected ? "text.primary" : "text.secondary",
                                        fontWeight: isSubSelected ? 600 : 400,
                                      }}
                                    />
                                  </ListItemButton>
                                );
                              })}
                            </List>
                          </Collapse>
                        )}
                      </React.Fragment>
                    );
                  })}
                </List>
              </Box>
            );
          })}
        </Box>
      </Drawer>

      {/* Main */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box
          sx={{
            height: 56, px: 3, display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: "background.paper",
            position: "sticky", top: 0, zIndex: 10,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {currentPage === "Rented Logs" ? "Rented Machinery" : currentPage}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title="Download summary report">
              <IconButton onClick={onGenerateReport} size="small" sx={{ color: "text.secondary" }}>
                <PictureAsPdfIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
              <IconButton onClick={onToggleTheme} size="small" sx={{ color: "text.secondary" }}>
                {isDark ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Sign out">
              <IconButton onClick={onLogout} size="small" sx={{ color: "text.secondary" }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {children}
      </Box>
    </Box>
  );
}
