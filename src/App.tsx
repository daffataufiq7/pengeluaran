import { useState } from 'react';
import { Container, Box, Typography, Button, TextField, Paper, List, ListItem, ListItemText, IconButton, AppBar, Toolbar, Grid, Checkbox, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { Drawer, List as MUIList, ListItemButton, ListItemIcon, Divider, InputLabel } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Expense {
  id: number;
  date: string;
  description: string;
  amount: number;
}

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Ambil semua user dari localStorage
function getAllUsers() {
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
}

// Simpan semua user ke localStorage
function saveAllUsers(users: {username: string, password: string}[]) {
  localStorage.setItem('users', JSON.stringify(users));
}

// Ambil pengeluaran user dari localStorage
function getUserExpenses(username: string) {
  const data = localStorage.getItem(`expenses_${username}`);
  return data ? JSON.parse(data) : [];
}

// Simpan pengeluaran user ke localStorage
function saveUserExpenses(username: string, expenses: Expense[]) {
  localStorage.setItem(`expenses_${username}`, JSON.stringify(expenses));
}

function App() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');

  // Expense state
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menu, setMenu] = useState<'dashboard' | 'catat'>('dashboard');

  // Untuk form catat pengeluaran
  const [catatTanggal, setCatatTanggal] = useState(getTodayDate());
  const [catatDesc, setCatatDesc] = useState('');
  const [catatAmount, setCatatAmount] = useState('');

  // Akumulasi uang per hari (minggu berjalan)
  const getWeekDates = () => {
    const now = new Date();
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      week.push(d.toISOString().split('T')[0]);
    }
    return week;
  };
  const weekDates = getWeekDates();
  const weekData = weekDates.map(date =>
    expenses.filter(e => e.date === date).reduce((sum, e) => sum + e.amount, 0)
  );

  // Handle register
  const handleRegister = () => {
    if (!username || !password) {
      setAuthError('Username dan password wajib diisi');
      return;
    }
    const users = getAllUsers();
    if (users.find((u: any) => u.username === username)) {
      setAuthError('Username sudah terdaftar');
      return;
    }
    users.push({ username, password });
    saveAllUsers(users);
    setShowRegister(false);
    setAuthError('');
    setUsername('');
    setPassword('');
    alert('Akun berhasil dibuat! Silakan login.');
  };

  // Handle login
  const handleLogin = () => {
    const users = getAllUsers();
    const user = users.find((u: any) => u.username === username && u.password === password);
    if (!user) {
      setAuthError('Username atau password salah');
      return;
    }
    setIsLoggedIn(true);
    setCurrentUser(username);
    setExpenses(getUserExpenses(username));
    setAuthError('');
    setUsername('');
    setPassword('');
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setExpenses([]);
  };

  // Handle delete expense
  const handleDeleteExpense = (id: number) => {
    if (!currentUser) return;
    const newExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(newExpenses);
    saveUserExpenses(currentUser, newExpenses);
  };

  // Filter expenses for today
  const today = getTodayDate();
  const todayExpenses = expenses.filter((e) => e.date === today);

  // UI
  if (!isLoggedIn) {
    return (
      <Grid container sx={{ minHeight: '100vh', background: '#b39ddb', alignItems: 'center', justifyContent: 'center' }}>
        {/* Kiri: Ilustrasi & Info */}
        <Grid {...{ item: true, xs: 12, md: 6 }} sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#7c4dff',
          minHeight: '100vh',
          py: { xs: 6, md: 0 },
        }}>
          <Box sx={{ color: 'white', textAlign: 'center', px: { xs: 2, md: 6 }, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2.5rem' } }}>Catatan Pengeluaran Gen Z</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <img src="uangnew.jpg" alt="Ilustrasi" style={{ width: '60%', maxWidth: 180, margin: '2rem 0', display: 'block' }} />
            </Box>
            <Typography variant="body1" sx={{ mb: 4, fontSize: { xs: '0.9rem', md: '1.1rem' } }}>Nabunglah dan Irit wahai anak muda</Typography>
          </Box>
        </Grid>
        {/* Kanan: Form Login/Register */}
        <Grid {...{ item: true, xs: 12, md: 6 }} sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'white',
          minHeight: '100vh',
        }}>
          <Box sx={{
            width: { xs: '100%', sm: 340 },
            p: { xs: 2, sm: 4 },
            mx: { xs: 2, sm: 0 },
            boxShadow: { xs: 1, md: 0 },
            borderRadius: { xs: 2, md: 0 },
            bgcolor: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: { xs: 'auto', md: 400 },
          }}>
            <Typography variant="h5" fontWeight={700} gutterBottom align="left" sx={{ width: '100%' }}>{showRegister ? 'Create Account' : 'Login'}</Typography>
            <Typography variant="body2" align="left" sx={{ mb: 2, width: '100%' }}>
              {showRegister ? 'Sudah punya akun? ' : "Don't have an account? "}
              <Button size="small" sx={{ textTransform: 'none', p: 0, minWidth: 0 }} onClick={() => { setShowRegister(!showRegister); setAuthError(''); }}>
                {showRegister ? 'Login' : 'Create your account'}
              </Button>
            </Typography>
            <TextField
              label="Username or Email"
              fullWidth
              margin="normal"
              value={username}
              onChange={e => setUsername(e.target.value)}
              sx={{ bgcolor: 'white' }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              sx={{ bgcolor: 'white' }}
            />
            {showRegister && (
              <TextField
                label="Konfirmasi Password"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                disabled
                sx={{ bgcolor: 'white' }}
              />
            )}
            {authError && <Typography color="error" variant="body2" sx={{ mt: 1, width: '100%' }}>{authError}</Typography>}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, width: '100%' }}>
              <FormControlLabel control={<Checkbox size="small" />} label="Remember me" />
              <Button size="small" sx={{ textTransform: 'none', p: 0, minWidth: 0 }}>Forgot password?</Button>
            </Box>
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2, bgcolor: '#7c4dff', '&:hover': { bgcolor: '#512da8' } }}
              onClick={showRegister ? handleRegister : handleLogin}
            >
              {showRegister ? 'Sign Up' : 'Login'}
            </Button>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 4, color: '#bdbdbd', fontWeight: 700 }}>
              dappataufiq.com
            </Typography>
          </Box>
        </Grid>
      </Grid>
    );
  }

  // Dashboard content
  let dashboardContent = null;
  if (menu === 'dashboard') {
    dashboardContent = (
      <Box>
        <Typography variant="h6" gutterBottom>Akumulasi Pengeluaran Mingguan</Typography>
        <Bar
          data={{
            labels: weekDates,
            datasets: [{
              label: 'Total Pengeluaran (Rp)',
              data: weekData,
              backgroundColor: '#7c4dff',
            }],
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
          }}
        />
        <Typography variant="h6" sx={{ mt: 4 }}>Pengeluaran Hari Ini ({today})</Typography>
        <List>
          {todayExpenses.length === 0 && (
            <ListItem>
              <ListItemText primary="Belum ada pengeluaran hari ini." />
            </ListItem>
          )}
          {todayExpenses.map((e) => (
            <ListItem key={e.id} secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteExpense(e.id)}>
                <DeleteIcon />
              </IconButton>
            }>
              <ListItemText
                primary={e.description}
                secondary={`Rp${e.amount.toLocaleString()} | ${e.date}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  } else if (menu === 'catat') {
    dashboardContent = (
      <Box>
        <Typography variant="h6" gutterBottom>Catat Pengeluaran</Typography>
        <Box component="form" onSubmit={e => { e.preventDefault(); if (!catatDesc || !catatAmount || !catatTanggal || !currentUser) return; const newExpenses = [...expenses, { id: Date.now(), date: catatTanggal, description: catatDesc, amount: parseFloat(catatAmount) }]; setExpenses(newExpenses); saveUserExpenses(currentUser, newExpenses); setCatatDesc(''); setCatatAmount(''); setCatatTanggal(getTodayDate()); setMenu('dashboard'); }}>
          <InputLabel shrink htmlFor="catat-tanggal">Tanggal</InputLabel>
          <TextField
            id="catat-tanggal"
            type="date"
            fullWidth
            margin="normal"
            value={catatTanggal}
            onChange={e => setCatatTanggal(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <InputLabel shrink htmlFor="catat-desc">Deskripsi</InputLabel>
          <TextField
            id="catat-desc"
            fullWidth
            margin="normal"
            value={catatDesc}
            onChange={e => setCatatDesc(e.target.value)}
            placeholder="Contoh: Makan siang, Listrik, dll"
          />
          <InputLabel shrink htmlFor="catat-amount">Nominal (Rp)</InputLabel>
          <TextField
            id="catat-amount"
            type="number"
            fullWidth
            margin="normal"
            value={catatAmount}
            onChange={e => setCatatAmount(e.target.value)}
            placeholder="Contoh: 20000"
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, bgcolor: '#7c4dff', '&:hover': { bgcolor: '#512da8' } }}>Catat Pengeluaran</Button>
        </Box>
      </Box>
    );
  }

  // Sidebar
  const Sidebar = (
    <Drawer anchor="left" open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
      <Box sx={{ width: 250, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountCircleIcon fontSize="large" />
          <Box>
            <Typography fontWeight={700}>{currentUser}</Typography>
            <Typography variant="caption">Masuk sebagai User</Typography>
          </Box>
        </Box>
        <Divider />
        <MUIList>
          <ListItemButton selected={menu === 'dashboard'} onClick={() => { setMenu('dashboard'); setSidebarOpen(false); }}>
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton selected={menu === 'catat'} onClick={() => { setMenu('catat'); setSidebarOpen(false); }}>
            <ListItemIcon><AddCircleIcon /></ListItemIcon>
            <ListItemText primary="Catat Pengeluaran" />
          </ListItemButton>
        </MUIList>
        <Box sx={{ flexGrow: 1 }} />
        <Divider />
        <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Drawer>
  );

  return (
    <Box>
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setSidebarOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dashboard Pengeluaran Anak Kos
          </Typography>
        </Toolbar>
      </AppBar>
      {Sidebar}
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={2} sx={{ p: 3, minHeight: 400 }}>
          {dashboardContent}
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
