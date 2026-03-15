// test-connection.js - Prueba de conexión a SQL Server
const { getPool } = require('./db');

async function testConnection() {
    try {
        console.log('🔄 Intentando conectar a SQL Server...');
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM tbCliente');
        console.log('✅ ¡CONEXIÓN EXITOSA!');
        console.log(`📊 Se encontraron ${result.recordset.length} clientes en la base de datos`);
        if (result.recordset.length > 0) {
            console.log('👤 Primer cliente:', result.recordset[0]);
        }
    } catch (err) {
        console.error('❌ ERROR DE CONEXIÓN:');
        console.error(err);
    }
}

testConnection();