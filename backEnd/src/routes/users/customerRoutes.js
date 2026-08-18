import express from "express";
import customerController from "../../controllers/users/customerController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";
import { requirePermission } from "../../middlewares/auth/permissionMiddleware.js";
import ownsResourceOrIsAdmin from "../../middlewares/auth/ownershipMiddleware.js";

const router = express.Router();

// Listar todos los clientes (PII): admin siempre, o un empleado con el
// permiso de pantalla "clients" asignado explícitamente.
/**
 * @swagger
 * /users/customers:
 *   get:
 *     summary: Lista los clientes registrados
 *     description: Solo admin. Soporta filtros de búsqueda vía query string (mismos criterios que crudUtils.searchDocuments).
 *     tags: [Usuarios - Clientes]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Arreglo de clientes.
 *       401:
 *         description: No autenticado o rol distinto de admin.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/").get(validateAuthCookie(["admin", "employee"]), requirePermission("clients"), customerController.getCustomers);
router
    .route("/:id")
    // El propio cliente puede editar su perfil, o un admin editar el de cualquiera
    /**
     * @swagger
     * /users/customers/{id}:
     *   patch:
     *     summary: Actualiza los datos de un cliente
     *     description: Admin (cualquier cliente) o el propio cliente (solo su perfil, verificado por ownership). Permite actualizar nombre y/o apellido.
     *     tags: [Usuarios - Clientes]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *         description: ID del cliente a actualizar.
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name: { type: string, example: "Juan" }
     *               lastname: { type: string, example: "Pérez" }
     *     responses:
     *       200:
     *         description: Cliente actualizado; devuelve el documento actualizado (sin password).
     *       400:
     *         description: Nombre o apellido inválidos.
     *       401:
     *         description: No autenticado.
     *       403:
     *         description: Un cliente intentó modificar el perfil de otra persona.
     *       404:
     *         description: No se encontró el cliente solicitado.
     *       500:
     *         description: Error interno del servidor.
     */
    .patch(validateAuthCookie(["admin", "customer"]), ownsResourceOrIsAdmin, customerController.updateCustomer)

export default router;
