import { Container, Box, Typography, Button, TextField, Paper, List, ListItem, ListItemText, IconButton, AppBar, Toolbar, Grid, Checkbox, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Drawer, List as MUIList, ListItemButton, ListItemIcon, Divider, InputLabel, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement } from 'chart.js';
import dayjs from 'dayjs';
import { Dialog, DialogTitle, DialogContent, DialogActions, Avatar } from '@mui/material';
import supabase from './supabaseClient';
import React, { useState, useMemo, useEffect } from 'react';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
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

  // State untuk navigasi grafik bulanan
  const [monthView, setMonthView] = useState(dayjs(getTodayDate()).format('YYYY-MM'));

  // Ambil semua bulan yang ada data pengeluaran
  const monthsWithData = Array.from(new Set(expenses.map(e => e.date.slice(0, 7)))).sort();

  // Tanggal awal dan akhir bulan yang dipilih
  const monthStartDate = dayjs(monthView + '-01');
  const monthEndDate = monthStartDate.endOf('month');
  // Buat array tanggal untuk bulan yang dipilih
  const monthDates = [];
  let d = monthStartDate;
  while (d.isBefore(monthEndDate) || d.isSame(monthEndDate, 'day')) {
    monthDates.push(d.format('YYYY-MM-DD'));
    d = d.add(1, 'day');
  }
  // Data pengeluaran per hari di bulan yang dipilih
  const monthChartData = monthDates.map(date =>
    expenses.filter(e => e.date === date).reduce((sum, e) => sum + e.amount, 0)
  );

  // Navigasi bulan
  const currentMonthIdx = monthsWithData.indexOf(monthView);
  const canPrevMonth = currentMonthIdx > 0;
  const canNextMonth = currentMonthIdx < monthsWithData.length - 1;

  // Ambil tanggal terawal dari data expenses
  const allDates = expenses.map(e => e.date);
  const minDate = allDates.length > 0 ? allDates.reduce((a, b) => (a < b ? a : b)) : getTodayDate();
  // Buat array tanggal dari minDate sampai hari ini
  function getDateRange(start: string, end: string) {
    const result = [];
    let current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      result.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return result;
  }
  const fullDates = getDateRange(minDate, getTodayDate());

  // Grafik mingguan: selalu 7 hari terakhir dari data
  const weekDates = fullDates.slice(-7);
  const weekData = weekDates.map(date =>
    expenses.filter(e => e.date === date).reduce((sum, e) => sum + e.amount, 0)
  );

  // --- Doughnut: Akumulasi per deskripsi untuk bulan yang dipilih ---
  const monthExpenses = expenses.filter(e => e.date.startsWith(monthView));
  const descTotalsMonth: { [desc: string]: number } = {};
  monthExpenses.forEach(e => {
    descTotalsMonth[e.description] = (descTotalsMonth[e.description] || 0) + e.amount;
  });
  const doughnutLabelsMonth = Object.keys(descTotalsMonth);
  const doughnutDataMonth = Object.values(descTotalsMonth);
  const doughnutColors = [
    '#7c4dff', '#21cbf3', '#ffb300', '#ff5252', '#66bb6a', '#ab47bc', '#29b6f6', '#ef5350', '#ffa726', '#8d6e63',
  ];

  // Handle register
  const handleRegister = async () => {
    if (!username || !password) {
      setAuthError('Username dan password wajib diisi');
      return;
    }
    const { error } = await supabase.auth.signUp({ email: username, password });
    if (error) {
      setAuthError(error.message);
      return;
    }
    setShowRegister(false);
    setAuthError('');
    setUsername('');
    setPassword('');
    alert('Akun berhasil dibuat! Silakan login.');
  };

  // Handle login
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: username, password });
    if (error) {
      setAuthError('Username atau password salah');
      return;
    }
    setIsLoggedIn(true);
    setCurrentUser(username);
    // Ambil data pengeluaran user dari Supabase
    fetchExpenses(username);
    setAuthError('');
    setUsername('');
    setPassword('');
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setExpenses([]);
  };

  // Fetch pengeluaran user dari Supabase
  type Expense = { id: number; date: string; description: string; amount: number };
  const fetchExpenses = async (userEmail: string): Promise<void> => {
    const { data, error } = await supabase
      .from('pengeluaran')
      .select('*')
      .eq('user', userEmail)
      .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } else {
      console.log('Fetched expenses:', data);
      setExpenses(data || []);
    }
  };

  // Log setiap kali state expenses berubah
  React.useEffect(() => {
    console.log('Expenses state:', expenses);
  }, [expenses]);

  // Ambil data pengeluaran otomatis saat login dan setiap kali currentUser berubah
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetchExpenses(currentUser);
    }
  }, [isLoggedIn, currentUser]);

  // Refresh data setiap kali menu dashboard dibuka
  useEffect(() => {
    if (menu === 'dashboard' && isLoggedIn && currentUser) {
      fetchExpenses(currentUser);
    }
  }, [menu, isLoggedIn, currentUser]);

  // Tambah pengeluaran
  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('pengeluaran')
      .insert([{ ...expense, user: currentUser }]);
    if (error) {
      console.error('Error adding expense:', error);
    } else {
      await fetchExpenses(currentUser); // pastikan refresh setelah tambah
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (id: number) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('pengeluaran')
      .delete()
      .eq('id', id)
      .eq('user', currentUser);
    if (!error) await fetchExpenses(currentUser); // refresh setelah hapus
  };

  // State untuk dialog konfirmasi hapus akun
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Fungsi hapus akun permanen (Supabase)
  const handleDeleteAccount = async (password: string) => {
    if (!currentUser) return;
    // Re-authenticate user
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentUser, password });
    if (signInError) {
      setDeleteError('Password salah!');
      return;
    }
    // Hapus akun dari Supabase Auth
    // const { error: deleteError } = await supabase.auth.admin.deleteUser(supabase.auth.user()?.id || '');
    // if (deleteError) {
    //   setDeleteError('Gagal menghapus akun.');
    //   return;
    // }
    // Hapus semua data pengeluaran user di tabel pengeluaran (bukan expenses)
    await supabase.from('pengeluaran').delete().eq('user', currentUser);
    setIsLoggedIn(false);
    setCurrentUser(null);
    setExpenses([]);
    setDeleteDialogOpen(false);
    setDeletePassword('');
    setDeleteError('');
  };

  // Filter expenses for today
  const today = getTodayDate();
  const todayExpenses = expenses.filter((e) => e.date === today);

  // Daftar pengeluaran per tanggal (7 hari terakhir)
  const expensesByDate: { [date: string]: Expense[] } = useMemo(() => {
    const byDate: { [date: string]: Expense[] } = {};
    fullDates.forEach(date => {
      byDate[date] = expenses.filter(e => e.date === date);
    });
    return byDate;
  }, [expenses, fullDates]);

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
            <Typography variant="h5" fontWeight={700} gutterBottom align="left" sx={{ width: '100%' }}>{showRegister ? 'Buat Akun' : 'Masuk'}</Typography>
            <Typography variant="body2" align="left" sx={{ mb: 2, width: '100%' }}>
              {showRegister ? 'Sudah punya akun? ' : "Belum punya akun? "}
              <Button size="small" sx={{ textTransform: 'none', p: 0, minWidth: 0 }} onClick={() => { setShowRegister(!showRegister); setAuthError(''); }}>
                {showRegister ? 'Masuk' : 'Buat akunmu'}
              </Button>
            </Typography>
            <TextField
              label="Username atau Email"
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
              <FormControlLabel control={<Checkbox size="small" />} label="Ingat saya" />
              <Button size="small" sx={{ textTransform: 'none', p: 0, minWidth: 0 }}>Lupa password?</Button>
            </Box>
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2, bgcolor: '#7c4dff', '&:hover': { bgcolor: '#512da8' } }}
              onClick={showRegister ? handleRegister : handleLogin}
            >
              {showRegister ? 'Daftar' : 'Masuk'}
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
        {/* Grafik Bar Bulanan dengan navigasi bulan */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4 }}>
          <Typography variant="h6">Rekap Pengeluaran Bulan {dayjs(monthView).format('MMMM YYYY')}</Typography>
          <Box>
            <Button size="small" onClick={() => setMonthView(monthsWithData[currentMonthIdx - 1])} disabled={!canPrevMonth}>&lt;</Button>
            <Button size="small" onClick={() => setMonthView(monthsWithData[currentMonthIdx + 1])} disabled={!canNextMonth}>&gt;</Button>
          </Box>
        </Box>
        <Box sx={{ overflowX: 'auto', width: '100%', pb: 2 }}>
          <Box sx={{ minWidth: { xs: 400, sm: Math.max(600, monthDates.length * 60) }, maxWidth: '100%' }}>
            <Bar
              data={{
                labels: monthDates,
                datasets: [{
                  label: 'Total Pengeluaran (Rp)',
                  data: monthChartData,
                  backgroundColor: '#21cbf3',
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { maxRotation: 90, minRotation: 45, autoSkip: false, font: { size: 10 } },
                  },
                  y: { beginAtZero: true, ticks: { font: { size: 10 } } },
                },
                maintainAspectRatio: false,
              }}
              height={180}
            />
          </Box>
        </Box>
        {/* Grafik Doughnut Akumulasi per bulan */}
        <Typography variant="h6" sx={{ mt: 4 }}>Akumulasi Pengeluaran per Deskripsi (Bulan {dayjs(monthView).format('MMMM YYYY')})</Typography>
        <Box sx={{ maxWidth: 320, mx: 'auto', mb: 4 }}>
          <Doughnut
            data={{
              labels: doughnutLabelsMonth.length > 0 ? doughnutLabelsMonth : ['Tidak ada data'],
              datasets: [{
                data: doughnutDataMonth.length > 0 ? doughnutDataMonth : [1],
                backgroundColor: doughnutDataMonth.length > 0 ? doughnutColors : ['#e0e0e0'],
              }],
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } },
            }}
          />
        </Box>
        <Typography variant="h6" sx={{ mt: 4 }}>Pengeluaran Hari Ini ({today})</Typography>
        <List>
          {todayExpenses.length === 0 && (
            <ListItem>
              <ListItemText primary="Belum ada pengeluaran hari ini." />
            </ListItem>
          )}
          {todayExpenses.map((e: Expense) => (
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
        <Typography variant="h6" sx={{ mt: 4 }}>Semua Pengeluaran (per Tanggal)</Typography>
        {fullDates.map(date => (
          <Accordion key={date} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>{date}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {expensesByDate[date].length === 0 ? (
                  <ListItem>
                    <ListItemText primary="Tidak ada pengeluaran." />
                  </ListItem>
                ) : (
                  expensesByDate[date].map((e: Expense) => (
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
                  ))
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  }
  if (menu === 'catat') {
    dashboardContent = (
      <Box>
        <Typography variant="h6" gutterBottom>Catat Pengeluaran</Typography>
        <Box component="form" onSubmit={async e => {
          e.preventDefault();
          if (!catatDesc || !catatAmount || !catatTanggal || !currentUser) return;
          await handleAddExpense({ date: catatTanggal, description: catatDesc, amount: parseFloat(catatAmount) });
          setCatatDesc('');
          setCatatAmount('');
          setCatatTanggal(getTodayDate());
          setMenu('dashboard');
        }}>
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
          <Avatar
            src={currentUser ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(currentUser)}` : undefined}
            alt="avatar"
            sx={{ width: 48, height: 48, bgcolor: '#eee' }}
          />
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
          <ListItemButton onClick={() => setDeleteDialogOpen(true)} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
            <ListItemText primary="Hapus Akun" />
          </ListItemButton>
        </Box>
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
            Dashboard Pengeluaran GEN Z
          </Typography>
        </Toolbar>
      </AppBar>
      {Sidebar}
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4, position: 'relative', zIndex: 1 }}>
        <Box sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
          overflow: 'hidden',
          borderRadius: 3,
          boxShadow: 3,
          animation: 'bgMove 8s linear infinite',
        }} />
        {/* Responsive Paper container */}
        <Paper elevation={2} sx={{ p: { xs: 1, sm: 3 }, minHeight: 400, position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.95)', borderRadius: 3, boxShadow: 3, maxWidth: { xs: '100vw', sm: 600 } }}>
          {dashboardContent}
        </Paper>
      </Container>
      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setDeletePassword(''); setDeleteError(''); }}>
        <DialogTitle>Konfirmasi Hapus Akun</DialogTitle>
        <DialogContent>
          <Typography>Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.</Typography>
          <Typography sx={{ mt: 2 }}>Masukkan password untuk konfirmasi:</Typography>
          <TextField
            type="password"
            fullWidth
            margin="normal"
            value={deletePassword}
            onChange={e => setDeletePassword(e.target.value)}
            label="Password"
            autoFocus
          />
          {deleteError && <Typography color="error">{deleteError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setDeletePassword(''); setDeleteError(''); }}>Tidak</Button>
          <Button color="error" variant="contained" onClick={async () => {
            await handleDeleteAccount(deletePassword);
          }}>Ya, Hapus Akun</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
