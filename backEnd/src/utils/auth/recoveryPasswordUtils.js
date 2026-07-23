const recoveryResponse = {
    // PASO 1 — Solicitar código
    requestCode: {
        invalidEmail: (message) => ({ error: true, title: "Correo no válido", message }),
        invalidUserType: { error: true, title: "Rol no válido", message: "El tipo de usuario especificado no es válido." },
        userNotFound: { error: true, title: "Usuario no encontrado", message: "No existe ninguna cuenta asociada a este correo electrónico." },
        success: { error: false, message: "Correo de recuperación enviado." },
        serverError: { error: true, title: "Error del servidor", message: "Ocurrió un problema interno al enviar el correo." }
    },

    // PASO 2 — Verificar código
    verifyCode: {
        invalidCode: (message) => ({ error: true, title: "Código inválido", message }),
        sessionExpired: { error: true, title: "Sesión expirada", message: "La sesión de recuperación ha caducado. Solicita un nuevo código." },
        incorrectCode: { error: true, title: "Código incorrecto", message: "El código ingresado es incorrecto o no coincide." },
        success: { error: false, message: "Código verificado correctamente. Proceda a cambiar su contraseña." },
        serverError: { error: true, title: "Error de verificación", message: "No se pudo verificar el código o el token ha expirado." }
    },

    // PASO 3 — Establecer nueva contraseña
    newPassword: {
        invalidPassword: (message) => ({ error: true, title: "Contraseña inválida", message }),
        passwordsMismatch: { error: true, title: "Contraseñas no coinciden", message: "Verifica que ambas contraseñas sean idénticas." },
        sessionExpired: { error: true, title: "Sesión expirada", message: "La sesión de recuperación ha caducado. Vuelve a intentar." },
        notVerified: { error: true, title: "Acceso no autorizado", message: "Debes verificar el código antes de cambiar la contraseña." },
        success: { error: false, message: "Contraseña actualizada exitosamente." },
        serverError: { error: true, title: "Error del servidor", message: "No se pudo actualizar la contraseña. Intente más tarde." }
    }
};

export default recoveryResponse;