// ========= BINANCE API PROXY SERVER - Node.js + Express =========
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ========= CONFIGURAZIONE =========
const BINANCE_API_KEY = 'GvO7Sq7cMotxIllUl81l1LpZINRqIx6Xy399IQjG5y95efRUBSFKmntSFZxmgObY';
const BINANCE_API_SECRET = 'AXDHeGXXSUVJohT7v0nOUYIVMKwfuATyLC7EM5hrE3cKN2oXVFmZ1NuSfvYPsxlX';
const BINANCE_BASE_URL = 'https://api.binance.com';

app.use(cors());
app.use(express.json());

// ========= FUNZIONE HMAC SIGNATURE =========
function createSignature(queryString) {
  return crypto
    .createHmac('sha256', BINANCE_API_SECRET)
    .update(queryString)
    .digest('hex');
}

// ========= ENDPOINT: TEST CONNECTION =========
app.get('/api/ping', async (req, res) => {
  try {
    const response = await axios.get(`${BINANCE_BASE_URL}/api/v3/ping`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========= ENDPOINT: GET PRICE =========
app.get('/api/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await axios.get(`${BINANCE_BASE_URL}/api/v3/ticker/price`, {
      params: { symbol: symbol.toUpperCase() }
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========= ENDPOINT: GET ACCOUNT INFO (AUTH) =========
app.get('/api/account', async (req, res) => {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}&recvWindow=5000`;
    const signature = createSignature(queryString);
    
    const response = await axios.get(`${BINANCE_BASE_URL}/api/v3/account`, {
      params: {
        timestamp,
        recvWindow: 5000,
        signature
      },
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      }
    });
    
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

// ========= ENDPOINT: GET BALANCE =========
app.get('/api/balance/:asset', async (req, res) => {
  try {
    const { asset } = req.params;
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}&recvWindow=5000`;
    const signature = createSignature(queryString);
    
    const response = await axios.get(`${BINANCE_BASE_URL}/api/v3/account`, {
      params: {
        timestamp,
        recvWindow: 5000,
        signature
      },
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      }
    });
    
    const balance = response.data.balances.find(b => b.asset === asset.toUpperCase());
    
    res.json({ 
      success: true, 
      data: balance || { asset: asset.toUpperCase(), free: '0', locked: '0' }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

// ========= ROOT ENDPOINT =========
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Binance API Proxy Server',
    status: 'online',
    endpoints: [
      'GET /api/ping',
      'GET /api/price/:symbol',
      'GET /api/account',
      'GET /api/balance/:asset'
    ]
  });
});

// ========= START SERVER =========
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;
