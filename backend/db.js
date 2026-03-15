const sql = require('mssql');

const config = {
    server: 'LAPTOP-EPU4CAHE\\SQLEXPRESS',
    database: 'banco',
    user: 'node_user',
    password: 'Node123!',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', err => {
    console.error('Error en el pool de conexiones:', err);
});

async function getPool() {
    await poolConnect;
    return pool;
}

module.exports = {
    sql,
    getPool
};