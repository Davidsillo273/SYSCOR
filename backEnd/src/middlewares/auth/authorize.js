export const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: "Access denied. User not authenticated." });
      }

      if (user.role === "admin") {
        return next();
      }

      const userPermissions = user.permissions || [];

      if (userPermissions.includes(requiredPermission)) {
        return next(); 
      }

      return res.status(403).json({ 
        message: "Access denied. You do not have permission to view this section of the dashboard." 
      });

    } catch (error) {
      console.error("Error in authorization middleware:", error);
      return res.status(500).json({ message: "Internal server error while validating permissions." });
    }
  };
};