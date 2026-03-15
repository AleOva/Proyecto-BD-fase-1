// server.js - Servidor API para Banco de Vivienda
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { getPool, sql } = require('./db');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============================================
// ENDPOINTS PÚBLICOS
// ============================================

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API del Banco de Vivienda funcionando correctamente',
        timestamp: new Date()
    });
});

// ============================================
// ENDPOINTS DE AUTENTICACIÓN
// ============================================

// Login de usuario (simulado por ahora)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, rol } = req.body;
        
        // Buscar el cliente por nombre de usuario
        const pool = await getPool();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT idCLiente, PrimerNombre, PrimerApellido 
                FROM tbCliente 
                WHERE PrimerNombre LIKE @username + '%'
            `);
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }
        
        const cliente = result.recordset[0];
        
        res.json({
            success: true,
            idCliente: cliente.idCLiente,
            nombre: `${cliente.PrimerNombre.trim()} ${cliente.PrimerApellido.trim()}`,
            rol: rol || 'cliente'
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor' 
        });
    }
});

// ============================================
// ENDPOINTS PARA CLIENTES
// ============================================

// Obtener todas las cuentas y créditos de un cliente
app.get('/api/clientes/:id/cuentas', async (req, res) => {
    try {
        const clienteId = req.params.id;
        
        const pool = await getPool();
        const result = await pool.request()
            .input('clienteId', sql.Int, clienteId)
            .query(`
                SELECT 
                    o.idCuenta,
                    p.NombreProducto AS TipoProducto,
                    o.Limite AS Saldo,
                    o.FechaAperturo,
                    o.FechaVencimiento,
                    CASE 
                        WHEN p.idtipoOperacion = 1 THEN 'CUENTA'
                        ELSE 'CREDITO'
                    END AS Tipo
                FROM tbObligacion o
                INNER JOIN tbtipoProducto p ON o.idProducto = p.idProducto
                WHERE o.idcliente = @clienteId
                ORDER BY p.idtipoOperacion, o.FechaAperturo DESC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error al obtener cuentas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor' 
        });
    }
});

// Obtener solo cuentas de ahorro/monetarias de un cliente
app.get('/api/clientes/:id/cuentas-ahorro', async (req, res) => {
    try {
        const clienteId = req.params.id;
        
        const pool = await getPool();
        const result = await pool.request()
            .input('clienteId', sql.Int, clienteId)
            .query(`
                SELECT 
                    o.idCuenta,
                    p.NombreProducto AS TipoCuenta,
                    o.Limite AS Saldo,
                    o.FechaAperturo
                FROM tbObligacion o
                INNER JOIN tbtipoProducto p ON o.idProducto = p.idProducto
                WHERE o.idcliente = @clienteId
                AND p.idtipoOperacion = 1  -- Captaciones (cuentas)
                ORDER BY o.FechaAperturo DESC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error al obtener cuentas de ahorro:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor' 
        });
    }
});

// Obtener solo créditos de un cliente
app.get('/api/clientes/:id/creditos', async (req, res) => {
    try {
        const clienteId = req.params.id;
        
        const pool = await getPool();
        const result = await pool.request()
            .input('clienteId', sql.Int, clienteId)
            .query(`
                SELECT 
                    o.idCuenta,
                    p.NombreProducto AS TipoCredito,
                    o.Limite AS MontoAprobado,
                    o.FechaAperturo,
                    o.FechaVencimiento,
                    ISNULL((
                        SELECT TOP 1 SaldoActual 
                        FROM tbhistorialcrediticio 
                        WHERE idCuenta = o.idCuenta 
                        ORDER BY FechaCorte DESC
                    ), 0) AS SaldoPendiente
                FROM tbObligacion o
                INNER JOIN tbtipoProducto p ON o.idProducto = p.idProducto
                WHERE o.idcliente = @clienteId
                AND p.idtipoOperacion = 2  -- Colocaciones (créditos)
                ORDER BY o.FechaAperturo DESC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error al obtener créditos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor' 
        });
    }
});

// Obtener pagos de un crédito específico
app.get('/api/creditos/:id/pagos', async (req, res) => {
    try {
        const creditoId = req.params.id;
        
        const pool = await getPool();
        const result = await pool.request()
            .input('creditoId', sql.Int, creditoId)
            .query(`
                SELECT 
                    FechaCorte,
                    SaldoActual,
                    SaldoMora,
                    diasmora
                FROM tbhistorialcrediticio
                WHERE idCuenta = @creditoId
                ORDER BY FechaCorte DESC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor' 
        });
    }
});

// ============================================
// ENDPOINTS PARA COLABORADORES
// ============================================

// Buscar clientes por nombre
app.get('/api/buscar-clientes', async (req, res) => {
    try {
        const { termino } = req.query;
        
        if (!termino || termino.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }
        
        const pool = await getPool();
        const result = await pool.request()
            .input('termino', sql.NVarChar, `%${termino}%`)
            .query(`
                SELECT 
                    idCLiente,
                    PrimerNombre + ' ' + ISNULL(SegundoNombre, '') + ' ' + PrimerApellido AS NombreCompleto,
                    Fechanacimiento,
                    TelefonoLaboral
                FROM tbCliente
                WHERE PrimerNombre LIKE @termino
                   OR PrimerApellido LIKE @termino
                ORDER BY PrimerNombre
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error en búsqueda:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor' 
        });
    }
});

// Ver pagos por vencer (próximos 15 días)
app.get('/api/pagos-por-vencer', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT 
                    c.PrimerNombre + ' ' + c.PrimerApellido AS Cliente,
                    c.TelefonoLaboral,
                    o.idCuenta,
                    p.NombreProducto AS TipoCredito,
                    DATEADD(MONTH, 1, o.FechaVencimiento) AS FechaProximoPago,
                    o.Limite AS MontoCuota
                FROM tbObligacion o
                INNER JOIN tbCliente c ON o.idcliente = c.idCLiente
                INNER JOIN tbtipoProducto p ON o.idProducto = p.idProducto
                WHERE p.idtipoOperacion = 2  -- Créditos
                AND o.FechaVencimiento BETWEEN GETDATE() AND DATEADD(DAY, 15, GETDATE())
                ORDER BY o.FechaVencimiento
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error al obtener pagos por vencer:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor' 
        });
    }
});

// ============================================
// ENDPOINTS PARA SOLICITUDES (SIMULADOS)
// ============================================

// Solicitar nuevo crédito
app.post('/api/solicitar-credito', async (req, res) => {
    try {
        const { idCliente, tipo, monto, plazo, descripcion } = req.body;
        
        // Aquí iría la lógica para insertar la solicitud
        // Por ahora solo simulamos éxito
        
        res.json({
            success: true,
            message: 'Solicitud de crédito recibida',
            data: {
                idCliente,
                tipo,
                monto,
                plazo,
                fechaSolicitud: new Date()
            }
        });
        
    } catch (error) {
        console.error('Error al solicitar crédito:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor' 
        });
    }
});

// Solicitar nueva cuenta
app.post('/api/solicitar-cuenta', async (req, res) => {
    try {
        const { idCliente, tipoCuenta, montoInicial } = req.body;
        
        res.json({
            success: true,
            message: 'Solicitud de cuenta recibida',
            data: {
                idCliente,
                tipoCuenta,
                montoInicial,
                fechaSolicitud: new Date()
            }
        });
        
    } catch (error) {
        console.error('Error al solicitar cuenta:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor' 
        });
    }
});

// ============================================
// INICIAR EL SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`✅ Servidor API corriendo en http://localhost:${PORT}`);
    console.log('📡 Endpoints disponibles:');
    console.log('   GET  /api/test');
    console.log('   POST /api/login');
    console.log('   GET  /api/clientes/:id/cuentas');
    console.log('   GET  /api/clientes/:id/cuentas-ahorro');
    console.log('   GET  /api/clientes/:id/creditos');
    console.log('   GET  /api/creditos/:id/pagos');
    console.log('   GET  /api/buscar-clientes?termino=...');
    console.log('   GET  /api/pagos-por-vencer');
    console.log('   POST /api/solicitar-credito');
    console.log('   POST /api/solicitar-cuenta');
});