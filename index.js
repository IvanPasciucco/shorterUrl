require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

// MIDDLEWARE IMPORTANTE: 
// Necesario para leer los datos del formulario (body-parser integrado en Express)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// -----------------------------------------------------------------
// SOLUCIÓN URL SHORTENER
// -----------------------------------------------------------------

// Base de datos simple en memoria (se borra si reinicias el servidor)
const urlDatabase = {}; 
let idCounter = 1; 

// POST: Recibir URL y acortarla
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  
  // 1. Validar formato básico (http/https)
  let hostname;
  try {
    const parsedUrl = new urlParser.URL(originalUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }
    hostname = parsedUrl.hostname;
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // 2. Validar que el dominio existe con DNS
  dns.lookup(hostname, (err, address) => {
    if (err || !address) {
      return res.json({ error: 'invalid url' });
    }

    // 3. Guardar y devolver respuesta
    const shortUrl = idCounter;
    urlDatabase[shortUrl] = originalUrl;
    idCounter++;

    res.json({ 
      original_url: originalUrl, 
      short_url: shortUrl 
    });
  });
});

// GET: Redireccionar usando el ID corto
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: "No short URL found for the given input" });
  }
});
// -----------------------------------------------------------------

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});