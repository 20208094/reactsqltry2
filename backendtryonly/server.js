const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8085;

const config = {
    user: process.env.DB_USER || 'agritayo',
    password: process.env.DB_PASSWORD || 'Irregular4',
    server: process.env.DB_SERVER || 'agritayo.database.windows.net',
    database: process.env.DB_NAME || 'AgriTayo',
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to Azure SQL Database');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed! Bad Config: ', err);
        throw err;
    });

const distPath = path.join(__dirname, '../frontend/dist/');
app.use(express.static(distPath));

app.get('/home/*', (req, res) => {
    res.sendFile('index.html', { root: distPath });
});

app.get('/', (req, res) => {
    res.redirect('/home/');
});

app.get('/api/data', async (req, res) => {
    try {
        const pool = await poolPromise;
        console.log('Connected to the pool');
        
        // Add a timeout check to ensure the query doesn't hang indefinitely
        const timeoutPromise = new Promise((resolve, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), 5000)
        );

        const queryPromise = pool.request().query('SELECT * FROM dbo.sample');

        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        console.log('Query executed');
        console.log('Data fetched:', result.recordset); // Log the fetched data
        res.json(result.recordset);
    } catch (err) {
        console.error('Error executing SQL query:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/data', async (req, res) => {
    try {
        const { id, name, city } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('city', sql.NVarChar, city)
            .query('INSERT INTO dbo.sample (id, name, city) VALUES (@id, @name, @city)');
        res.status(201).json({ message: 'Record added successfully' });
    } catch (err) {
        console.error('Error executing SQL query:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, city } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('city', sql.NVarChar, city)
            .query('UPDATE dbo.sample SET name = @name, city = @city WHERE id = @id');
        res.status(200).json({ message: 'Record updated successfully' });
    } catch (err) {
        console.error('Error executing SQL query:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM dbo.sample WHERE id = @id');
        res.status(200).json({ message: 'Record deleted successfully' });
    } catch (err) {
        console.error('Error executing SQL query:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
