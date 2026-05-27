const express = require('express');

const app = express();

// utile pour le health check de l'application
app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'ok'
  });
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server is running on port 3000');
});