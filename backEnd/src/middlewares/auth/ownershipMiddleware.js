// Middleware genérico para endpoints tipo PATCH/PUT sobre "el propio recurso"
// (ej. un cliente editando su propio perfil, un empleado editando el suyo).
//
// Se usa DESPUÉS de validateAuthCookie([...roles...]), que ya dejó req.user
// con lo que venía en el JWT (incluye "id" y "role"). Este middleware no
// vuelve a verificar el rol: solo decide si la persona autenticada tiene
// permitido tocar el registro identificado por :id en la URL.
//
// Regla: pasa si es admin (control total) O si el id del usuario autenticado
// coincide con el :id del recurso que se quiere modificar. Cualquier otro
// caso se rechaza con 403, para que un empleado/cliente no pueda editar el
// perfil de otra persona solo cambiando el id en la URL.
const ownsResourceOrIsAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ title: "Sesión requerida", message: "No se encontró una sesión activa." });
  }

  const isAdmin = req.user.role === "admin";
  const isOwner = req.user.id === req.params.id;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ title: "Acceso denegado", message: "Solo podés modificar tu propio perfil." });
  }

  return next();
};

export default ownsResourceOrIsAdmin;
