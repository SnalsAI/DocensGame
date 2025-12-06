export const baseTemplate = (content: string, preheader: string = '') => `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EDU-ATELIER</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: rgba(255,255,255,0.9);
      margin: 5px 0 0;
      font-size: 14px;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #10b981;
      color: white !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #059669;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 12px;
    }
    .footer a {
      color: #10b981;
    }
    .stat-box {
      background: #f0fdf4;
      border-radius: 8px;
      padding: 15px;
      margin: 10px 0;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #10b981;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    .badge-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto;
      display: block;
    }
    .preheader {
      display: none !important;
      visibility: hidden;
      opacity: 0;
      color: transparent;
      height: 0;
      width: 0;
    }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="wrapper">
    <div class="header">
      <h1>EDU-ATELIER</h1>
      <p>Piattaforma Didattica Interattiva</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>
        Questa email è stata inviata da <a href="https://edu-atelier.it">EDU-ATELIER</a>.<br>
        Se non desideri più ricevere queste email, puoi <a href="#">modificare le preferenze</a>.
      </p>
      <p>© ${new Date().getFullYear()} EDU-ATELIER. Tutti i diritti riservati.</p>
    </div>
  </div>
</body>
</html>
`;
