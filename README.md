SYSCOR — Sistema de Gestión Integral para Taquería El Corral
SYSCOR es una solución tecnológica desarrollada a medida para optimizar y modernizar las operaciones administrativas, contables y comerciales de Taquería El Corral. El sistema combina una plataforma web de gestión interna con una aplicación móvil orientada al cliente final, resultado de un proceso formal de levantamiento de requerimientos y entrevistas directas con la administración del negocio.

Tabla de Contenidos

Descripción General
Funcionalidades
Tecnologías Utilizadas
Estructura del Proyecto
Instalación y Configuración
Variables de Entorno
Roles del Sistema
Licencia


Descripción General
El proyecto surge como respuesta a los desafíos operativos identificados en Taquería El Corral: desorden en el registro de compras, dificultades en la gestión del personal, pérdida de ventas en horarios de alta demanda, y ausencia de herramientas para la administración de eventos. SYSCOR centraliza estas áreas en un sistema unificado, reduciendo errores humanos y mejorando la eficiencia general del negocio.
Sistema realizado utilizando formato de camelCase

Funcionalidades
Control de Compras e IVA

Procesamiento unificado de facturas en formato JSON y PDF
Identificación y seguimiento de documentos procesados para libros de IVA
Comparación exacta de datos para eliminación de errores contables
Generación de reportes para comunicación con el contador

Gestión de Personal y Planilla

Registro de empleados con datos personales, DUI y NIT
Control de pagos adicionales, asuetos y descuentos de ley
Cálculo automatizado de deducciones AFP e ISSS
Generación de planilla con trazabilidad completa

Pedidos en Línea — Aplicación Móvil

Visualización del menú con fotografías y descripción de productos
Sistema de pedidos para retiro en local
División automática de comandas por área: bebidas, comida general y especialidades mexicanas

Pagos en Línea

Integración con la pasarela de pago Wompi

Reservación de Eventos

Módulo de reserva para eventos especiales en el local
Control de detalles operativos: mantelería, prioridad en atención y capacidad


Tecnologías Utilizadas
Backend

Node.js
Express.js
MongoDB / Mongoose

Frontend Web

React.js

Aplicación Móvil

React Native

Autenticación y Seguridad

JSON Web Tokens (JWT)
Bcrypt

Servicios Externos

Nodemailer (notificaciones por correo)
Wompi (pagos en línea)

Instalación y Configuración
Prerrequisitos

Node.js v18 o superior
MongoDB
npm

1. Clonar el repositorio
git clone https://github.com/Davidsillo273/SYSCOR.git
cd syscor

2. Configurar el backend
cd backEnd
npm install
npm run dev

3. Configurar un frontend
cd frontEndAdmin   # o frontEndEmployee / frontEndClient
npm install
npm run dev

Roles del Sistema
RolDescripciónAdministradorAcceso completo a todos los módulos de gestiónEmpleadoGestión de pedidos, comandas y atención al clienteClienteConsulta de menú, pedidos en línea y reservación de eventos

Licencia
Proyecto desarrollado como propuesta tecnológica para Taquería El Corral. Todos los derechos reservados.
