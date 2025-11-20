require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

// Get GCash access token
async function getAccessToken() {
  const response = await fetch('https://api.gcash.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GCASH_CLIENT_ID,
      client_secret: process.env.GCASH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    })
  });
  const data = await response.json();
  return data.access_token;
}

// Create a GCash payment
app.post('/create-payment', async (req, res) => {
  const { ride, amount } = req.body;
  const token = await getAccessToken();

  // Call GCash API to create payment
  const response = await fetch('https://api.gcash.com/payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: amount,
      description: `Payment for ${ride}`,
      callback_url: 'https://yourwebsite.com/payment-callback' // webhook URL
    })
  });

  const data = await response.json();
  res.json({ paymentUrl: data.checkout_url });
});

// Webhook for payment confirmation
app.post('/payment-callback', (req, res) => {
  const { status, ride, amount } = req.body;
  if (status === 'SUCCESS') {
    console.log(`Payment for ${ride} ₱${amount} confirmed!`);
    // TODO: Update your database: mark ride as booked
  }
  res.sendStatus(200);
});

app.listen(3000, () => console.log('Server running on port 3000'));
