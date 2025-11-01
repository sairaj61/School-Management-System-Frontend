import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Box,
  useTheme,
  useMediaQuery,
  Slide,
  Fade,
  useScrollTrigger,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import PaymentIcon from '@mui/icons-material/Payment';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import SchoolIcon from '@mui/icons-material/School';
import appConfig from '../config/appConfig';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings'; // New icon for Administrative
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const Navbar = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [academicAnchorEl, setAcademicAnchorEl] = useState(null);
  const [financeAnchorEl, setFinanceAnchorEl] = useState(null);
  const [transportAnchorEl, setTransportAnchorEl] = useState(null);
  const [adminAnchorEl, setAdminAnchorEl] = useState(null); // New state for Administrative menu
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [userInfo, setUserInfo] = useState({
    username: localStorage.getItem('username') || '',
    tenantName: localStorage.getItem('tenant_name') || '',
  });

  // Listen for storage changes (e.g., after login) and update state
  useEffect(() => {
    const syncUserInfo = () => {
      setUserInfo({
        username: localStorage.getItem('username') || '',
        tenantName: localStorage.getItem('tenant_name') || '',
      });
    };
    window.addEventListener('storage', syncUserInfo);
    window.addEventListener('user-info-updated', syncUserInfo);
    syncUserInfo();
    return () => {
      window.removeEventListener('storage', syncUserInfo);
      window.removeEventListener('user-info-updated', syncUserInfo);
    };
  }, []);
  // const isSuperuser = (localStorage.getItem('role') || 'superuser') === 'superuser'; // Superuser logic removed

  const handleAcademicMenuOpen = (event) => {
    setAcademicAnchorEl(event.currentTarget);
  };

  const handleAcademicMenuClose = () => {
    setAcademicAnchorEl(null);
  };

  const handleFinanceMenuOpen = (event) => {
    setFinanceAnchorEl(event.currentTarget);
  };

  const handleFinanceMenuClose = () => {
    setFinanceAnchorEl(null);
  };

  const handleTransportMenuOpen = (event) => {
    setTransportAnchorEl(event.currentTarget);
  };

  const handleTransportMenuClose = () => {
    setTransportAnchorEl(null);
  };

  // Handlers for the new Administrative menu
  const handleAdminMenuOpen = (event) => {
    setAdminAnchorEl(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminAnchorEl(null);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    handleUserMenuClose();
    navigate('/login');
  };

  return (
    <>
      <HideOnScroll>
        <AppBar
          position="fixed"
          sx={{
            bgcolor: 'primary.main',
            boxShadow: 2,
            zIndex: (theme) => theme.zIndex.drawer + 1,
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <Toolbar
            sx={{
              minHeight: '64px',
              px: { xs: 2, sm: 4 },
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                // For mobile, you might want a single consolidated menu or adjust this logic
                // For simplicity, let's keep it as academic for now, or add a single menu for all
                onClick={handleAcademicMenuOpen} // Consider a single main menu for mobile
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Fade in>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <img
                  src={appConfig.logo}
                  alt="Logo"
                  style={{ height: '40px', width: '40px' }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: 1,
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {userInfo.tenantName}
                  </Typography>
                </Box>
              </Box>
            </Fade>

            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  color="inherit"
                  startIcon={<DashboardIcon />}
                  component={NavLink}
                  to="/dashboard"
                >
                  Dashboard
                </Button>

                {/* Academic Management Dropdown */}
                <Box>
                  <Button
                    color="inherit"
                    startIcon={<SchoolIcon />}
                    onClick={handleAcademicMenuOpen}
                  >
                    Academic
                  </Button>
                  <Menu
                    anchorEl={academicAnchorEl}
                    open={Boolean(academicAnchorEl)}
                    onClose={handleAcademicMenuClose}
                  >
                    <MenuItem
                      onClick={() => {
                        handleAcademicMenuClose();
                        navigate('/students');
                      }}
                    >
                      <PeopleIcon sx={{ mr: 1 }} />
                      Students
                    </MenuItem>
                      <MenuItem
                        onClick={() => {
                          handleAcademicMenuClose();
                          navigate('/subjects');
                        }}
                      >
                        <CategoryIcon sx={{ mr: 1 }} />
                        Subjects
                      </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleAcademicMenuClose();
                        navigate('/classes');
                      }}
                    >
                      <ClassIcon sx={{ mr: 1 }} />
                      Classes
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleAcademicMenuClose();
                        navigate('/sections');
                      }}
                    >
                      <ViewWeekIcon sx={{ mr: 1 }} />
                      Sections
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleAcademicMenuClose();
                        navigate('/academic-years');
                      }}
                    >
                      <CalendarTodayIcon sx={{ mr: 1 }} />
                      Academic Years
                    </MenuItem>
                  </Menu>
                </Box>

                {/* Fee & Finance Dropdown */}
                <Box>
                  <Button
                    color="inherit"
                    startIcon={<PaymentIcon />}
                    onClick={handleFinanceMenuOpen}
                  >
                    Finance
                  </Button>
                  <Menu
                    anchorEl={financeAnchorEl}
                    open={Boolean(financeAnchorEl)}
                    onClose={handleFinanceMenuClose}
                  >
                    <MenuItem
                      onClick={() => {
                        handleFinanceMenuClose();
                        navigate('/fees');
                      }}
                    >
                      <PaymentIcon sx={{ mr: 1 }} />
                      Fee Payments
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleFinanceMenuClose();
                        navigate('/fee-categories');
                      }}
                    >
                      <CategoryIcon sx={{ mr: 1 }} />
                      Fee Categories
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleFinanceMenuClose();
                        navigate('/finance/concessions');
                      }}
                    >
                      <LocalOfferIcon sx={{ mr: 1 }} />
                      Concession Types
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleFinanceMenuClose();
                        navigate('/fee-structure');
                      }}
                    >
                      <AttachMoneyIcon sx={{ mr: 1 }} />
                      Fee Structure
                    </MenuItem>
                  </Menu>
                </Box>

                {/* Transport Management Dropdown */}
                <Box>
                  <Button
                    color="inherit"
                    startIcon={<DirectionsBusIcon />}
                    onClick={handleTransportMenuOpen}
                  >
                    Transport
                  </Button>
                  <Menu
                    anchorEl={transportAnchorEl}
                    open={Boolean(transportAnchorEl)}
                    onClose={handleTransportMenuClose}
                  >
                    <MenuItem
                      onClick={() => {
                        handleTransportMenuClose();
                        navigate('/routes');
                      }}
                    >
                      <DirectionsBusIcon sx={{ mr: 1 }} />
                      Routes
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleTransportMenuClose();
                        navigate('/drivers');
                      }}
                    >
                      <PersonIcon sx={{ mr: 1 }} />
                      Drivers
                    </MenuItem>
                  </Menu>
                </Box>

                {/* New Administrative Dropdown */}
                <Box>
                  <Button
                    color="inherit"
                    startIcon={<SettingsIcon />} // Using SettingsIcon for Administrative
                    onClick={handleAdminMenuOpen}
                  >
                    Administrative
                  </Button>
                  <Menu
                    anchorEl={adminAnchorEl}
                    open={Boolean(adminAnchorEl)}
                    onClose={handleAdminMenuClose}
                  >
                    <MenuItem
                      onClick={() => {
                        handleAdminMenuClose();
                        navigate('/user-mapping');
                      }}
                    >
                      <PersonIcon sx={{ mr: 1 }} />
                      User Mapping
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleAdminMenuClose();
                        navigate('/staff'); // New route for Staff
                      }}
                    >
                      <PeopleIcon sx={{ mr: 1 }} /> {/* Reusing PeopleIcon for staff */}
                      Staff
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleAdminMenuClose();
                        navigate('/expenditures'); // New route for Expenditures
                      }}
                    >
                      <AttachMoneyIcon sx={{ mr: 1 }} /> {/* Reusing AttachMoneyIcon for expenditures */}
                      Expenditures
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleAdminMenuClose();
                        navigate('/expenditure-categories'); // New route for Expenditure Categories
                      }}
                    >
                      <CategoryIcon sx={{ mr: 1 }} /> {/* Reusing CategoryIcon for expenditure categories */}
                      Expenditure Categories
                    </MenuItem>
                  </Menu>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton
                    color="inherit"
                    onClick={handleUserMenuOpen}
                    sx={{ ml: 2 }}
                    size="large"
                  >
                    <AccountCircleIcon fontSize="large" />
                  </IconButton>
                  <Menu
                    anchorEl={userMenuAnchorEl}
                    open={Boolean(userMenuAnchorEl)}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <MenuItem
                      disabled
                      sx={{ fontWeight: 'bold', opacity: 1, fontSize: 16 }}
                    >
                      {userInfo.username || 'User'}
                    </MenuItem>
                    <MenuItem onClick={() => navigate('/change-password')}>Change Password</MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </Menu>
                </Box>
              </Box>
            )}
          </Toolbar>
        </AppBar>
      </HideOnScroll>

      <Toolbar sx={{ mb: 2 }} />
    </>
  );
};

export default Navbar;