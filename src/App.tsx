import { useState } from 'react';
import { Container, Box, Typography, Button, TextField, Paper, List, ListItem, ListItemText, IconButton, AppBar, Toolbar, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
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
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            {showRegister ? 'Buat Akun' : 'Login'}
          </Typography>
          <TextField
            label="Username"
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
          {authError && <Typography color="error" variant="body2">{authError}</Typography>}
          <Box mt={2}>
            {showRegister ? (
              <>
                <Button variant="contained" fullWidth onClick={handleRegister}>Buat Akun</Button>
                <Button fullWidth sx={{ mt: 1 }} onClick={() => { setShowRegister(false); setAuthError(''); }}>Sudah punya akun? Login</Button>
              </>
            ) : (
              <>
                <Button variant="contained" fullWidth onClick={handleLogin}>Login</Button>
                <Button fullWidth sx={{ mt: 1 }} onClick={() => { setShowRegister(true); setAuthError(''); }}>Belum punya akun? Daftar</Button>
              </>
            )}
          </Box>
        </Paper>
      </Container>
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
