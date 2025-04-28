const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const db = require('./db');
const multer = require('multer');
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

////Account Balance API ////

// Fake user data (in a real app, this would come from a database)
const accounts = {
  '1001': { name: 'Alice', email: 'alice@example.com', balance: 1200 },
  '1002': { name: 'Bob', email: 'bob@example.com', balance: 3500 },
  '1003': { name: 'Charlie', email: 'charlie@example.com', balance: 800 },
  '1004': { name: 'David', email: 'david@example.com', balance: 620 },
  '1005': { name: 'Eva', email: 'eva@example.com', balance: 5000 },
  '1006': { name: 'Frank', email: 'frank@example.com', balance: 150 },
  '1007': { name: 'Grace', email: 'grace@example.com', balance: 7200 },
  '1008': { name: 'Hank', email: 'hank@example.com', balance: 310 },
  '1009': { name: 'Ivy', email: 'ivy@example.com', balance: 4550 },
  '1010': { name: 'Jack', email: 'jack@example.com', balance: 2100 }
};

// Insecure endpoint: no auth, no rate limiting, leaks PII
app.get('/balance/:accountId', (req, res) => {
  const { accountId } = req.params;
  const account = accounts[accountId];

  if (account) {
    return res.json(account); // leaks full PII + balance
  } else {
    return res.status(404).json({ message: 'Account not found' });
  }
});

/////Fund Transfer API /////

let balances = {
    "1001": 5000,
    "1002": 3000,
    "1003": 7000
  };
  
  app.post('/transfer', (req, res) => {
    const { from, to, amount, transaction_ref } = req.body;
  
    const sqlQuery = `INSERT INTO transactions (from_account, to_account, amount, transaction_ref) VALUES ('${from}', '${to}', '${amount}', '${transaction_ref}')`;
  
    //console.log(` Simulated SQL: ${sqlQuery}`);
  
    // Simulate SQL Injection detection
    if (
      transaction_ref.includes("DROP TABLE") ||
      transaction_ref.includes("--") ||
      transaction_ref.includes("' OR '1'='1") ||
      transaction_ref.includes(";")
    ) {
      const headers = {
        'X-Powered-By': 'Express',
        'Content-Type': 'application/json; charset=utf-8',
        'Connection': 'keep-alive',
        'Simulated-Warning': ' SQL Injection Detected'
      };
  
      res.set(headers);
      return res.status(500).json({
        error: " SQL Injection Detected",
        query: sqlQuery,
        hint: "Malicious content in transaction_ref",
        simulatedEffect: "If connected to DB, this could have executed dangerous SQL"
      });
    }
  
    // Simulate insecure fund transfer (no auth, no validation)
    if (!balances[from] || !balances[to]) {
      return res.status(400).json({ message: 'Invalid account(s)' });
    }
  
    balances[from] -= parseFloat(amount);
    balances[to] += parseFloat(amount);
  
    res.set({
      'X-Powered-By': 'Express',
      'Content-Type': 'application/json; charset=utf-8',
      'Connection': 'keep-alive'
    });
  
    return res.status(200).json({
      message: 'Transfer completed (insecurely)',
      balances
    });
  });

////Transaction  History API ////

  app.get('/transactions', (req, res) => {
    const { accountId, filter } = req.query;
  
    //  INSECURE: Dynamic SQL + no auth + no pagination
    let query = `SELECT * FROM transactions WHERE accountId = ${accountId}`;
    if (filter) {
      query += ` AND description LIKE '%${filter}%'`;
    }
  
    console.log(" Executing SQL:", query);
  
    db.all(query, (err, rows) => {
      if (err) {
        return res.status(500).json({
          error: 'SQL Error',
          query,
          message: err.message
        });
      }
  
      res.json({
        accountId,
        total: rows.length,
        transactions: rows
      });
    });
  });

/////User Authentication API////

const db_new = new sqlite3.Database(':memory:');
const SECRET = 'super-insecure-key';

app.use(bodyParser.json());

// Create vulnerable users table
db_new.serialize(() => {
  db_new.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT
    )
  `);

  const insert = db_new.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  insert.run('admin', '123');        // Weak password
  insert.run('user1', 'password');   // Common password
  insert.run('test', 'test123');
  insert.run('admin','admin');  
  insert.run('root','root'); 
  insert.run('password','password');
  insert.run('wiener','peter');  
  insert.run('test','test'); // Reused credential
  insert.finalize();
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    db_new.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, user) => {
      if (err) return res.status(500).send('Internal error');
  
      if (user) {
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET);
        return res.send({
          message: 'Login successful',
          token,  //  Leaks token in response
          user    //  Exposes user data
        });
      } else {
        return res.status(401).send('Invalid credentials');
      }
    });
  });


////KYC Document API /////

// ------- Multer Storage for /uploadKYCPATH (path traversal vulnerable) -------
const storagePathTraversal = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const unsafePath = req.body.filename || file.originalname;
    const fullPath = path.join(__dirname, 'uploads', unsafePath);
    //console.log("🚨 Saving file to:", fullPath);
    cb(null, unsafePath);
  }
});

const uploadPathTraversal = multer({ storage: storagePathTraversal });

// ------- Multer Storage for /uploadKYC (user-defined path) -------
const storageUserPath = multer.diskStorage({
  destination: (req, file, cb) => {
    const userPath = req.body.path || './uploads';
    cb(null, userPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const uploadUserPath = multer({ storage: storageUserPath });

// ------- API 1: /uploadKYCPATH -------
app.post('/uploadKYCPATH', uploadPathTraversal.single('document'), (req, res) => {
  res.json({
    message: "File uploaded successfully (KYCPATH)",
    filename: req.file.filename
  });
});

// ------- API 2: /uploadKYC -------
app.post('/uploadKYC', uploadUserPath.single('kyc'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send('No file uploaded');
    }

    // SSRF Vulnerability
    if (req.body.kycUrl) {
      const kycUrl = req.body.kycUrl;
      const response = await axios.get(kycUrl, { responseType: 'arraybuffer' });

      const targetPath = path.join(req.body.path || './uploads', path.basename(kycUrl));
      fs.writeFileSync(targetPath, response.data);
    }

    // Metadata Leakage
    const metadata = {
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      uploadTime: new Date().toISOString(),
      userPath: req.body.path
    };

    fs.writeFileSync(`${file.path}.meta.json`, JSON.stringify(metadata, null, 2));

    res.send('KYC Document uploaded (vulnerably).');
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

////User Profile API /////

app.use(express.json());

//  Fake user database
const users = {
  "user001": {
    userId: "user001",
    name: "Alice",
    email: "alice@example.com",
    phone: "+91-9876543210",
    address: "123 Main Street, Mumbai",
    role: "user",
    bio: "Hello there!"
},
  "user002": {
    userId: "user002",
    name: "Karan",
    email: "karan@example.com",
    phone: "+91-9876543210",
    address: "123 Main Street, Mumbai",
    role: "HR",
    bio: "Nice Department"
},
   "user003": {
    userId: "user003",
    name: "Harmesh",
    email: "harmesh@example.com",
    phone: "+91-9876543210",
    address: "123 Main Street, Housing Board",
    role: "Support",
    bio: "Nice place" 
},

  "user004": {
    userId: "user004",
    name: "Admin",
    email: "admin@example.com",
    phone: "+91-9999999999",
    address: "Admin HQ",
    role: "admin",
    bio: "Superuser"
  }
};

//  /updateProfile – vulnerable to IDOR, mass assignment, and XSS
app.post('/updateProfile', (req, res) => {
  const { userId, ...updates } = req.body;

  const user = users[userId];
  if (!user) return res.status(404).json({ error: "User not found" });

  //  Mass assignment (no field filtering)
  Object.assign(user, updates);

  //  No validation, reflects input directly
  res.json({
    message: "Profile updated",
    user: user  // ❗ Includes PII like email, phone, address
  });
});

//  Get full profile (simulate public profile with PII)
app.get('/profile/:userId', (req, res) => {
  const user = users[req.params.userId];
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json(user);  // Includes PII and no sanitization
});

///KYC_Document_API





/////Card Management API ////

//  Fake in-memory card data
const cards = {
    "1": { id: "345653", user: "user1", pan: "4111111111111111", expiry: "12/27", cvv: "123", bank: "Chase" },
    "2": { id: "345654", user: "user2", pan: "5500000000000004", expiry: "11/26", cvv: "456", bank: "Bank of America" },
    "3": { id: "345655", user: "user3", pan: "340000000000009", expiry: "10/25", cvv: "789", bank: "American Express" },
    "4": { id: "345656", user: "user4", pan: "6011000000000004", expiry: "01/28", cvv: "321", bank: "Discover" },
    "5": { id: "345657", user: "user5", pan: "3530111333300000", expiry: "02/28", cvv: "111", bank: "MUFG Bank" },
    "6": { id: "345658", user: "user6", pan: "6304000000000000", expiry: "03/29", cvv: "222", bank: "Sainsbury's Bank" },
    "7": { id: "345659", user: "user7", pan: "6759649826438453", expiry: "04/30", cvv: "333", bank: "Barclays" },
    "8": { id: "345660", user: "user8", pan: "5424000000000015", expiry: "05/25", cvv: "444", bank: "Wells Fargo" },
    "9": { id: "345661", user: "user9", pan: "4111111111111111", expiry: "06/26", cvv: "555", bank: "Chase" },
    "10": { id: "345662", user: "user10", pan: "4000056655665556", expiry: "07/27", cvv: "666", bank: "Capital One" },
    "11": { id: "345663", user: "user11", pan: "5200828282828210", expiry: "08/27", cvv: "777", bank: "TD Bank" },
    "12": { id: "345664", user: "user12", pan: "378734493671000", expiry: "09/28", cvv: "888", bank: "American Express" },
    "13": { id: "345665", user: "user13", pan: "6011111111111117", expiry: "10/29", cvv: "999", bank: "Discover" },
    "14": { id: "345666", user: "user14", pan: "30569309025904", expiry: "11/25", cvv: "147", bank: "Diners Club" },
    "15": { id: "345667", user: "user15", pan: "38520000023237", expiry: "12/26", cvv: "258", bank: "Diners Club" },
    "16": { id: "345668", user: "user16", pan: "4222222222222", expiry: "01/27", cvv: "369", bank: "Visa Inc." },
    "17": { id: "345669", user: "user17", pan: "4012888888881881", expiry: "02/28", cvv: "159", bank: "Bank of America" },
    "18": { id: "345670", user: "user18", pan: "5105105105105100", expiry: "03/29", cvv: "753", bank: "HSBC" },
    "19": { id: "345671", user: "user19", pan: "6011000990139424", expiry: "04/30", cvv: "852", bank: "Discover" },
    "20": { id: "345672", user: "user20", pan: "3566002020360505", expiry: "05/30", cvv: "951", bank: "JCB" },
    "21": { id: "345673", user: "user21", pan: "6304000000000000", expiry: "06/31", cvv: "357", bank: "Sainsbury's Bank" },
    "22": { id: "345674", user: "user22", pan: "6759649826438453", expiry: "07/32", cvv: "456", bank: "Barclays" },
    "23": { id: "345675", user: "user23", pan: "4111111111111111", expiry: "08/33", cvv: "654", bank: "Chase" }
  };
  
  

//  No authentication middleware (missing verification)

//  Vulnerable Endpoint: No auth, IDOR, no rate limits, no masking
app.get('/cardDetails/:cardId', (req, res) => {
  const { cardId } = req.params;
  const card = cards[cardId];

  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  //  Exposes full PAN and CVV
  res.json({
    cardId: card.id,
    user: card.user,
    pan: card.pan,
    expiry: card.expiry,
    cvv: card.cvv,
    bank:card.bank
  });
});

/////Loan Application API ////

//  Fake loan "database"
const loans = {};

//  Vulnerability: No authentication
//  Fake user session (for show)
const fakeUserId = "user123";

//  Vulnerability: No validation, logic flaws, injection vulnerable
app.post('/applyLoan', (req, res) => {
  const { userId, amount, income, reason, ssn, eligibilityFormula } = req.body;

  //  Vulnerability: No input validation
  //  Logic Flaw: Allow user to send in eligibility logic!
  let eligible;
  try {
    //  Injection point: user sends formula like "income > amount / 2"
    eligible = eval(eligibilityFormula); 
  } catch (e) {
    return res.status(400).json({ error: "Invalid formula" });
  }

  const loanId = Math.floor(10000 + Math.random() * 90000).toString();

  loans[loanId] = {
    loanId,
    userId,
    amount,
    income,
    reason,
    ssn,
    eligible
  };

  res.json({
    loanId,
    status: eligible ? "Approved" : "Rejected",
    message: "Loan application processed"
  });
});

//  Vulnerability: IDOR + Sensitive data exposure
app.get('/loan/:loanId', (req, res) => {
  const loan = loans[req.params.loanId];

  if (!loan) return res.status(404).json({ error: "Loan not found" });

  //  Exposing everything including SSN!
  res.json(loan);
});

/////Payment Gateway API /////

const payments = {}; // Memory store

//  /initiatePayment – no validation, easy to tamper
app.post('/initiatePayment', (req, res) => {
  const { orderId, userId, amount, callbackUrl } = req.body;

  // No validation or signature!
  const fakeSignature = Buffer.from(`${orderId}${amount}`).toString('base64'); // Weak "signature"

  payments[orderId] = {
    orderId,
    userId,
    amount,
    callbackUrl,
    paid: false,
    signature: fakeSignature
  };

  // Simulated redirect
  res.json({
    gatewayUrl: `http://localhost:3000/callback?orderId=${orderId}&amount=${amount}&signature=${fakeSignature}`,
    message: "Redirect to this URL to simulate payment"
  });
});


//  /callback – trust anything the client sends!
app.get('/callback', (req, res) => {
  const { orderId, amount, signature } = req.query;

  const payment = payments[orderId];
  if (!payment) return res.status(404).json({ error: 'Order not found' });

  // Weak verification (just comparing strings, no hashing)
  if (signature !== payment.signature) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // ✅ No check if payment is already marked (replay attack possible)
  payment.paid = true;

  //  Trust callback URL provided by client
  res.json({
    message: "Payment marked as completed",
    orderId,
    amount,
    status: "Success",
    redirectTo: payment.callbackUrl  //  Tamperable
  });
});

///Investment/Trading API/////

// Fake "market" prices
const marketPrices = {
    "AAPL": 180,
    "GOOG": 2700,
    "TSLA": 850
  };
  
  // In-memory "order book"
  const orders = [];
  
  //  No validation or locking - vulnerable to everything
  app.post('/placeOrder', (req, res) => {
    const { userId, stockSymbol, price, quantity, orderType } = req.body;
  
    //  No validation of stock symbol, quantity or price
    //  Logic flaw: can sell more than owned, or buy below market
    const order = {
      orderId: Math.floor(Math.random() * 100000),
      userId,
      stockSymbol,
      price,
      quantity,
      orderType, // "buy" or "sell"
      time: Date.now()
    };
  
    orders.push(order); //  No concurrency check or duplication prevention
  
    res.json({
      message: "Order placed",
      order
    });
  });
  
  // View all orders (simulate public order book)
  app.get('/orders', (req, res) => {
    res.json(orders);
  });


  app.listen(PORT, () => {
    console.log(`Insecure API running at http://localhost:${PORT}`);
  });