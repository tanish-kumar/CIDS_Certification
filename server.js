const express = require("express");
const mysql = require("mysql2");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

/* =======================
   MIDDLEWARE
======================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* =======================
   DATABASE CONNECTION
======================= */
const db = mysql.createConnection({
    host: "mysql-1921d3e-txnishkumar15.g.aivencloud.com",
    user: "avnadmin",
    password: "AVNS_sGhwRQTy8dydVea69d6",
    database: "defaultdb",
    port: 11737,
    ssl: {
        ca: fs.readFileSync(__dirname + "/ca.pem")
    },
    connectTimeout: 10000
});

db.connect(err => {
    if (err) {
        console.log("❌ Database Connection Failed");
        console.log(err);
    } else {
        console.log("✅ MySQL Connected");
    }
});

/* =======================
   ROUTES
======================= */

// Main Dashboard (2 Buttons)
app.get("/", (req, res) => {
    res.render("main");
});

// Form to Add Student
app.get("/add-student", (req, res) => {
    res.render("add-student");
});

// Save Student
app.post("/add-student", (req, res) => {
    const { name, phone, course, percentage, completion_date, address, subjects } = req.body;
    const sql = "INSERT INTO students (name, phone, course, percentage, completion_date, address, subjects) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, phone, course, percentage, completion_date, address, subjects], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error saving student");
        }
        res.redirect("/report"); // after adding, redirect to report
    });
});

// Student Report
app.get("/report", (req, res) => {
    db.query("SELECT * FROM students", (err, results) => {
        if (err) return res.send("DB Error");
        res.render("report", { students: results });
    });
});

// Certificate Verification Page
app.get("/verify/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM students WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).send("Server Error");
        if (result.length === 0) return res.send("No student found");
        res.render("verify", { student: result[0] });
    });
});

// Show QR generator form
app.get("/qr-generator", (req, res) => {
    res.render("qr-generator"); // new EJS
});

// Handle form submit to generate QR
app.post("/qr-generator", async (req, res) => {
    const { id, name } = req.body;

    // Check if student exists
    db.query("SELECT * FROM students WHERE id = ? AND name = ?", [id, name], async (err, result) => {
        if (err) return res.send("DB Error");
        if (result.length === 0) return res.send("<h3>❌ Student not found!</h3><a href='/qr-generator'>Go Back</a>");

        const verifyURL = `http://${req.get("host")}/verify/${id}`;
        const qrImage = await QRCode.toDataURL(verifyURL);

        res.send(`
            <h2>QR Code for ${name} (ID: ${id})</h2>
            <img src="${qrImage}" />
            <a href="/qr-generator" style="
                display: inline-block;
                padding: 10px 20px;
                background: #ff950a;
                color: white;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                transition: 0.3s;
            " onmouseover="this.style.background='#e07b00'" onmouseout="this.style.background='#ff950a'">Generate Another QR</a>
        `);
    });
});


/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
