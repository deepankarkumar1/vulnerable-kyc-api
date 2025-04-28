const multer = require('multer');
const path = require('path');

// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    accountId INTEGER,
    date TEXT,
    amount REAL,
    pan TEXT,
    card_number TEXT,
    description TEXT
  )`);

  const stmt = db.prepare(`INSERT INTO transactions 
    (accountId, date, amount, pan, card_number, description)
    VALUES (?, ?, ?, ?, ?, ?)`);
  
  stmt.run(123, '2024-01-01', 200, 'ABCDE1234F', '4111111111111111', 'SBI Holder'),
  stmt.run(321, '2024-01-02', 150, 'ABCDE1234F', '4222222222222222', 'CDAC Account'),
  stmt.run(456, '2024-01-03', 99,  'XYZDE5678L', '4333333333333333', 'PNB'),
  stmt.run(145, '2024-01-02', 125, 'ABCDE1234F', '4111111111111111', 'Electricity bill'),
  stmt.run(156, '2024-01-03', 300, 'ABCDE1234F', '4111111111111111', 'Online shopping'),
  stmt.run(345, '2024-01-04', 150, 'FGHIJ5678K', '4222222222222222', 'Fuel refill'),
  stmt.run(678, '2024-01-05', 100, 'FGHIJ5678K', '4222222222222222', 'Dinner at restaurant'),
  stmt.run(789, '2024-01-06', 500, 'KLMNO9012P', '4333333333333333', 'Flight booking'),
  stmt.run(987, '2024-01-07', 90, 'KLMNO9012P', '4333333333333333', 'Taxi ride'),
  stmt.run(999, '2024-01-08', 450, 'QRSTU3456V', '4444444444444444', 'Gaming console'),
  stmt.run(456, '2024-01-09', 120, 'QRSTU3456V', '4444444444444444', 'Streaming subscription'),
  stmt.run(679, '2024-01-10', 300, 'ZXCVB6789Q', '4555555555555555', 'Groceries and supplies');
  stmt.finalize();
});

module.exports = db;
///KYC_Document_api --- path traversal
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Files will be saved here
  },
  filename: function (req, file, cb) {
    const unsafePath = req.body.filename || file.originalname;
    const fullPath = path.join(__dirname, 'uploads', unsafePath); // This is vulnerable to path traversal
    console.log("🚨 Saving file to:", fullPath);
    cb(null, unsafePath); // No sanitization! This is dangerous.
  }
});
