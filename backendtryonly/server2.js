const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const config = {
    user: process.env.DB_USER || 'agritayo',
    password: process.env.DB_PASSWORD || 'Irregular4',
    server: process.env.DB_SERVER || 'agritayo.database.windows.net',
    port: process.env.DB_PORT || 1433,
    database: process.env.DB_NAME || 'AgriTayo',
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
};

app.get('/api/data', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM dbo.sample');
        
        // Log the data received from the database
        console.log('Data from database:', result.recordset);
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error executing SQL query:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/data', async (req, res) => {
    try {
        const { id, name, city } = req.body;
        const pool = await sql.connect(config);
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
        const pool = await sql.connect(config);
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
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM dbo.sample WHERE id = @id');
        res.status(200).json({ message: 'Record deleted successfully' });
    } catch (err) {
        console.error('Error executing SQL query:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
