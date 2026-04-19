import React from "react";
import { 
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, 
  Typography, IconButton, Tooltip, useTheme, Avatar, Divider, Collapse 
} from "@mui/material";
import { keyframes } from "@mui/system";

// Icons
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventNoteIcon from "@mui/icons-material/EventNote";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PeopleIcon from "@mui/icons-material/People";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import ScaleIcon from "@mui/icons-material/Scale";
import WarningIcon from "@mui/icons-material/Warning";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useAuthStore } from "../store/useAuthStore";

const drawerWidth = 272;

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
      { text: "Rented Logs", icon: <HistoryIcon fontSize="0.75rem" /> },
      { text: "Add Rented Vehicle", icon: <AddCircleOutlineIcon fontSize="0.75rem" /> },
    ]
  },
  { text: "Diesel", icon: <LocalGasStationIcon fontSize="small" />, section: "resources" },
  { text: "Expenses", icon: <AccountBalanceWalletIcon fontSize="small" />, section: "finance" },
];

const sections = [
  { key: "overview", label: "Overview" },
  { key: "operations", label: "Operations" },
  { key: "resources", label: "Resources" },
  { key: "finance", label: "Finance" },
];

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

export default function Layout({ children, onNavigate, currentPage, onToggleTheme, onLogout, onGenerateReport }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [openMenus, setOpenMenus] = React.useState({ "Rented Module": true });

  // Filter menu items based on role
  const visibleMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const handleMenuClick = (text) => {
    setOpenMenus(prev => ({ ...prev, [text]: !prev[text] }));
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
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
            backgroundImage: isDark ? "linear-gradient(180deg, #0d1017 0%, #0a0c10 100%)" : "none",
          },
        }}
      >
        <Box sx={{ px: 3, pt: 3.5, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Box sx={{ 
              width: 7, height: 7, borderRadius: "50%", 
              bgcolor: isDark ? "#22c55e" : "#2563eb", 
              boxShadow: isDark ? "0 0 8px #22c55e" : "none", 
              animation: `${pulse} 2.5s infinite` 
            }} />
            <Typography sx={{ fontSize: "0.6rem", letterSpacing: "0.18em", color: "text.secondary", fontWeight: 700 }}>
              SYSTEM ONLINE
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5 }}>
            <Box sx={{ 
              width: 36, height: 36, borderRadius: "8px", 
              background: isDark 
                ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" 
                : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", 
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
               <Box sx={{ width: 18, height: 18, border: "2.5px solid #fff", borderRadius: "3px" }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "1.05rem", fontWeight: 900, color: "text.primary", lineHeight: 1 }}>QUARRY</Typography>
              <Typography sx={{ fontSize: "0.6rem", color: "primary.main", fontWeight: 700 }}>PRO SUITE</Typography>
            </Box>
          </Box>
        </Box>

        {/* User Profile in Sidebar (Optional but good) */}
        <Box sx={{ px: 2, py: 2 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', noWrap: true }}>{user?.name}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>{user?.role}</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mx: 2, opacity: 0.5 }} />

        <Box sx={{ px: 2, py: 2, flex: 1 }}>
          {sections.map((section) => (
            <Box key={section.key} sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", px: 1.5, mb: 1, fontWeight: 700 }}>
                {section.label.toUpperCase()}
              </Typography>
              <List disablePadding>
                {visibleMenuItems.filter(m => m.section === section.key).map((item) => {
                  const isSelected = currentPage === item.text;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isOpen = openMenus[item.text];

                  return (
                    <React.Fragment key={item.text}>
                      <ListItemButton 
                        onClick={hasSubItems ? () => handleMenuClick(item.text) : () => onNavigate(item.text)} 
                        selected={isSelected}
                        sx={{
                          borderRadius: "8px", mb: 0.5,
                          "&.Mui-selected": { 
                              bgcolor: isDark ? "rgba(249,115,22,0.12)" : "rgba(37,99,235,0.08)",
                              "& .MuiListItemIcon-root": { color: "primary.main" }
                          }
                        }}>
                        <ListItemIcon sx={{ minWidth: 34, color: isSelected ? "primary.main" : "text.secondary" }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: "0.8rem", color: isSelected ? "text.primary" : "text.secondary", fontWeight: isSelected || hasSubItems ? 700 : 500 }} />
                        {hasSubItems && (isOpen ? <ExpandLess sx={{ fontSize: '1rem' }} /> : <ExpandMore sx={{ fontSize: '1rem' }} />)}
                      </ListItemButton>

                      {hasSubItems && (
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding sx={{ pl: 3 }}>
                            {item.subItems.map((sub) => {
                              const isSubSelected = currentPage === sub.text;
                              return (
                                <ListItemButton 
                                  key={sub.text} 
                                  onClick={() => onNavigate(sub.text)} 
                                  selected={isSubSelected}
                                  sx={{
                                    borderRadius: "8px", mb: 0.5,
                                    "&.Mui-selected": { 
                                        bgcolor: isDark ? "rgba(249,115,22,0.1)" : "rgba(37,99,235,0.06)",
                                        "& .MuiListItemIcon-root": { color: "primary.main" }
                                    }
                                  }}>
                                  <ListItemIcon sx={{ minWidth: 28, color: isSubSelected ? "primary.main" : "text.secondary" }}>{sub.icon}</ListItemIcon>
                                  <ListItemText primary={sub.text} primaryTypographyProps={{ fontSize: "0.75rem", color: isSubSelected ? "text.primary" : "text.secondary" }} />
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
          ))}
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Box sx={{ 
          height: 64, px: 4, display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: "background.paper"
        }}>
           <Typography sx={{ fontSize: "0.7rem", color: "primary.main", fontWeight: 700, letterSpacing: '0.1em' }}>
             {currentPage.toUpperCase()}
           </Typography>

           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             {/* PDF Summary Report Button */}
             <Tooltip title="Download Summary Report">
               <IconButton onClick={onGenerateReport} sx={{ color: "text.primary" }}>
                 <PictureAsPdfIcon />
               </IconButton>
             </Tooltip>

             {/* THE TOGGLE BUTTON */}
             <Tooltip title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}>
               <IconButton onClick={onToggleTheme} sx={{ color: "text.primary" }}>
                 {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
               </IconButton>
             </Tooltip>

             <Tooltip title="Sign Out">
               <IconButton onClick={onLogout} sx={{ color: "error.main" }}>
                 <LogoutIcon />
               </IconButton>
             </Tooltip>
           </Box>
        </Box>
        {children}
      </Box>
    </Box>
  );
}