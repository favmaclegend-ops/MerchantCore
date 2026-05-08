
// Register Interface param
interface regParam {
    email: string,
    username: string,
    full_name: string,
    password: string
}

// login interface
interface logParam {
    email: string,
    password: string
}


const API_BASE = 'https://merchantcore-api.onrender.com/api/v1';


// Register
async function register({email, username, full_name, password}: regParam) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, username, full_name, password }),
  });
  return response.json();
}


// Login
async function login({email, password}: logParam) {

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (response.ok) {
    // Store the token
    localStorage.setItem('token', data.access_token);
  }
  
  return {data, response};
}


// Get current user profile (authenticated request)
async function getProfile() {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
}

// Verify email
async function verifyEmail(token) {
  const response = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  return response.json();
}

export {register, login, getProfile, verifyEmail};