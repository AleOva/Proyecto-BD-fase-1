🏦 Banco de Vivienda - Guatemala
Sistema bancario desarrollado como proyecto académico para el Banco de Vivienda de Guatemala. Permite a los clientes consultar sus saldos, ver sus créditos y solicitar nuevos productos, mientras que los colaboradores pueden buscar clientes y verificar pagos por vencer.
📋 Descripción del Proyecto
El sistema consta de:
•	Base de datos: SQL Server con tablas para clientes, cuentas, créditos y pagos
•	Backend: API REST desarrollada con Node.js y Express
•	Frontend: Interfaz web con HTML, CSS y JavaScript
🚀 Funcionalidades
👤 Clientes
•	Consultar saldos de cuentas
•	Ver créditos activos
•	Consultar historial de pagos
•	Solicitar nuevos créditos
•	Solicitar apertura de cuentas
👥 Colaboradores
•	Buscar clientes por nombre
•	Ver información de clientes
•	Consultar pagos por vencer
•	Realizar solicitudes en nombre de clientes
🛠️ Tecnologías Utilizadas
Componente	Tecnología
Base de Datos	SQL Server Express
Backend	Node.js + Express
Frontend	HTML5, CSS3, JavaScript
Entorno	Desarrollo local
📁 Estructura del Proyecto
text
BancoWeb/
├── backend/           # API con Node.js
│   ├── server.js      # Servidor principal
│   ├── db.js          # Conexión a SQL Server
│   └── package.json   # Dependencias
├── frontend/          # Aplicación web
│   ├── index.html     # Página principal
│   └── app.js         # Lógica del frontend
└── database/          # Scripts SQL
    └── banco.sql      # Estructura de la BD
🔐 Seguridad
•	Roles de base de datos: Cliente y Colaborador
•	Usuarios de prueba: cliente1 y colaborador1
•	Permisos basados en el principio de mínimo privilegio
💾 Esquema de Backup
•	Completo: Semanal
•	Diferencial: Diario
•	Registro: Cada 4 horas
•	Retención: 4 semanas para backups completos
▶️ Cómo Ejecutar el Proyecto
Requisitos previos
•	SQL Server Express instalado
•	Node.js instalado
•	Base de datos "banco" restaurada
Pasos
1.	Restaurar la base de datos banco.sql en SQL Server
2.	En la carpeta backend, ejecutar:
text
npm install
node server.js

