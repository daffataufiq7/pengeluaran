import { useState } from 'react';
import { Container, Box, Typography, Button, TextField, Paper, List, ListItem, ListItemText, IconButton, AppBar, Toolbar, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Checkbox, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

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
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

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

  // Handle add expense
  const handleAddExpense = () => {
    if (!desc || !amount || !currentUser) return;
    const newExpenses = [
      ...expenses,
      {
        id: Date.now(),
        date: getTodayDate(),
        description: desc,
        amount: parseFloat(amount),
      },
    ];
    setExpenses(newExpenses);
    saveUserExpenses(currentUser, newExpenses);
    setDesc('');
    setAmount('');
    setDialogOpen(false);
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
      <Grid container sx={{ minHeight: '100vh', background: '#b39ddb' }}>
        {/* Kiri: Ilustrasi & Info */}
        <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center', bgcolor: '#7c4dff' }}>
          <Box sx={{ color: 'white', textAlign: 'center', px: 6 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>Catatan Pengeluaran Gen Z</Typography>
            <Box component="img" src="uangnew.jpg" alt="Ilustrasi" sx={{ width: 180, my: 4 }} />
            <Typography variant="body1" sx={{ mb: 4 }}>Nabunglah dan Irit wahai anak muda</Typography>
          </Box>
        </Grid>
        {/* Kanan: Form Login/Register */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'white' }}>
          <Box sx={{ width: 340, p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom align="left">{showRegister ? 'Create Account' : 'Login'}</Typography>
            <Typography variant="body2" align="left" sx={{ mb: 2 }}>
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
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {showRegister && (
              <TextField
                label="Konfirmasi Password"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                disabled
              />
            )}
            {authError && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{authError}</Typography>}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
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

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dashboard Pengeluaran Anak Kos
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Pengeluaran Hari Ini ({today})
          </Typography>
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
          <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => setDialogOpen(true)}>
            Tambah Pengeluaran
          </Button>
        </Paper>
      </Container>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Tambah Pengeluaran</DialogTitle>
        <DialogContent>
          <TextField
            label="Deskripsi"
            fullWidth
            margin="normal"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <TextField
            label="Nominal (Rp)"
            type="number"
            fullWidth
            margin="normal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleAddExpense}>Simpan</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
