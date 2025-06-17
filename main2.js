// app_pkn.js
const express = require('express');
const session = require('express-session');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Routes
app.use('/', routes);
app.use('/auth', authRoutes);
// Error handling
app.use(errorHandler);

// Start server
app.listen(3060 || 3000, () => {
    console.log(`Server running on port 3060 ${process.env.PORT || 3000}`);
});