// Importamos los modelos de los carritos y de los productos (combos, bebidas, extras) para calcular precios
import cartModel from "../../models/orders/cartModel.js";
import combosModel from "../../models/menu/combosModel.js";
import drinksModel from "../../models/menu/drinksModel.js";
import extrasModel from "../../models/menu/extrasModel.js";
import tablesModel from "../../models/tables/tablesModels.js";
import customerModel from "../../models/users/customerModel.js";
import notificationUtils from "../../utils/notifications/notificationUtils.js";

const cartController = {};

// Traducciones de los estados del pedido para redactar las notificaciones en español
const STATUS_LABELS = {
  pending: "PENDIENTE",
  cooking: "PREPARANDO",
  ready: "LISTO",
  delivered: "ENTREGADO",
  paid: "PAGADO",
};

// Arma un identificador corto y legible del pedido, igual al que muestra el panel (#A3F2)
const buildOrderCode = (cartId) => `#${(cartId || "").toString().slice(-4).toUpperCase()}`;

// Busca el número de la mesa para poder decir "Mesa 5" en vez de mostrar un id
const buildTableLabel = async (tableId) => {
  if (!tableId) return null;
  try {
    const table = await tablesModel.findById(tableId).select("number");
    return table?.number ? `Mesa ${table.number}` : null;
  } catch (error) {
    return null;
  }
};

// Busca el nombre del cliente dueño del pedido, para los pedidos hechos en línea
const buildCustomerName = async (customerId) => {
  if (!customerId) return "un cliente";
  try {
    const customer = await customerModel.findById(customerId).select("personalInfo");
    const name = `${customer?.personalInfo?.name || ""} ${customer?.personalInfo?.lastname || ""}`.trim();
    return name || "un cliente";
  } catch (error) {
    return "un cliente";
  }
};

// Obtiene todos los carritos registrados y expande los detalles del cliente y productos
cartController.getAllCarts = async (req, res) => {
  try {
    const carts = await cartModel
      .find()
      .populate("idCustomer", "personalInfo loginInfo.email")
      .populate("table", "number status")
      .populate("details.combos.comboId", "name price")
      .populate("details.extras.extraId", "name price")
      .populate("details.extras.drinks.drinkId", "name price");
    return res.status(200).json(carts);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Obtiene un carrito específico por su ID, mostrando toda su información detallada
cartController.getCartById = async (req, res) => {
  try {
    const cart = await cartModel
      .findById(req.params.id)
      .populate("idCustomer", "personalInfo loginInfo.email")
      .populate("table", "number status")
      .populate("details.combos.comboId", "name price")
      .populate("details.extras.extraId", "name price")
      .populate("details.extras.drinks.drinkId", "name price");

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    return res.status(200).json(cart);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Registra un nuevo carrito, calculando matemáticamente los subtotales y el total general de los productos
cartController.insertCart = async (req, res) => {
  try {
    const { idCustomer, table, details, status } = req.body;

    let totalGeneral = 0;
    let processedDetails = [];

    for (let detail of details) {
      let subTotalDetail = 0;


      if (detail.combos && detail.combos.length > 0) {
        for (let comboItem of detail.combos) {
          const comboFound = await combosModel.findById(comboItem.comboId);
          if (comboFound) {
            subTotalDetail += comboFound.price * (comboItem.quantity || 1);
          }
        }
      }


      if (detail.extras && detail.extras.length > 0) {
        for (let extraItem of detail.extras) {
          let totalExtraItem = 0;


          const extraFound = await extrasModel.findById(extraItem.extraId);
          if (extraFound) {
            totalExtraItem += extraFound.price;
          }


          if (extraItem.drinks && extraItem.drinks.length > 0) {
            for (let drinkItem of extraItem.drinks) {
              const drinkFound = await drinksModel.findById(drinkItem.drinkId);
              if (drinkFound) {
                totalExtraItem += drinkFound.price;
              }
            }
          }

          subTotalDetail += totalExtraItem * (extraItem.quantity || 1);
        }
      }


      totalGeneral += subTotalDetail;

      let detailObject = {
        combos: detail.combos || [],
        subTotal: subTotalDetail
      };

      if (detail.extras) {
        detailObject.extras = detail.extras;
      }

      processedDetails.push(detailObject);
    }

    const newCart = new cartModel({
      idCustomer,
      table: table || null,
      details: processedDetails,
      total: totalGeneral,
      status
    });

    await newCart.save();

    // Avisamos del nuevo pedido. Si vino de alguien con sesión (mesero, cajero)
    // se menciona a esa persona; si no, se trata como un pedido hecho en línea.
    const tableLabel = await buildTableLabel(newCart.table);
    const customerName = await buildCustomerName(newCart.idCustomer);
    const orderCode = buildOrderCode(newCart._id);
    const totalLabel = `$${(newCart.total || 0).toFixed(2)}`;

    await notificationUtils.createNotification({
      req,
      category: "orders",
      action: "created",
      title: "Nueva orden",
      message: (actor) =>
        actor.role === "admin" || actor.role === "employee"
          ? `${actor.name} creó una nueva orden ${orderCode} en la ${tableLabel || "barra"} por ${totalLabel}`
          : `Nuevo pedido en línea ${orderCode} de ${customerName} por ${totalLabel}`,
      icon: "receipt",
      severity: "success",
      entity: { model: "Cart", id: newCart._id, label: orderCode },
    });

    return res.status(201).json({ message: "Cart saved successfully", data: newCart });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Actualiza un carrito (por ejemplo, si agregaron más productos), recalculando el total desde cero
cartController.updateCart = async (req, res) => {
  try {
    const { idCustomer, table, details, status } = req.body;

    const updateData = {};
    if (idCustomer !== undefined) updateData.idCustomer = idCustomer;
    if (table !== undefined) updateData.table = table;
    if (status !== undefined) updateData.status = status;

    // Solo recalculamos details/total cuando el cliente manda details
    // (ej. useOrders.updateOrderStatus solo manda { status } para mover el pedido de pestaña)
    if (details !== undefined) {
      let totalGeneral = 0;
      let processedDetails = [];

      for (let detail of details) {
        let subTotalDetail = 0;

        if (detail.combos && detail.combos.length > 0) {
          for (let comboItem of detail.combos) {
            const comboFound = await combosModel.findById(comboItem.comboId);
            if (comboFound) {
              subTotalDetail += comboFound.price * (comboItem.quantity || 1);
            }
          }
        }

        if (detail.extras && detail.extras.length > 0) {
          for (let extraItem of detail.extras) {
            let totalExtraItem = 0;

            const extraFound = await extrasModel.findById(extraItem.extraId);
            if (extraFound) {
              totalExtraItem += extraFound.price;
            }

            if (extraItem.drinks && extraItem.drinks.length > 0) {
              for (let drinkItem of extraItem.drinks) {
                const drinkFound = await drinksModel.findById(drinkItem.drinkId);
                if (drinkFound) {
                  totalExtraItem += drinkFound.price;
                }
              }
            }

            subTotalDetail += totalExtraItem * (extraItem.quantity || 1);
          }
        }

        totalGeneral += subTotalDetail;

        let detailObject = {
          combos: detail.combos || [],
          subTotal: subTotalDetail
        };

        if (detail.extras) {
          detailObject.extras = detail.extras;
        }

        processedDetails.push(detailObject);
      }

      updateData.details = processedDetails;
      updateData.total = totalGeneral;
    }

    // Guardamos el estado anterior para poder detectar si el pedido cambió de fase
    const previousCart = await cartModel.findById(req.params.id).select("status table");

    const updatedCart = await cartModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedCart) return res.status(404).json({ message: "Cart not found" });

    const orderCode = buildOrderCode(updatedCart._id);
    const statusChanged = status !== undefined && previousCart?.status !== status;

    if (statusChanged) {
      // El cambio de estado es el movimiento más interesante para la cocina y el salón
      const statusLabel = STATUS_LABELS[status] || (status || "").toUpperCase();

      await notificationUtils.createNotification({
        req,
        category: "orders",
        action: "status_changed",
        title: "Orden actualizada",
        message: (actor) =>
          actor.role === "admin" || actor.role === "employee"
            ? `${actor.name} marcó la orden ${orderCode} como ${statusLabel}`
            : `La orden ${orderCode} pasó a ${statusLabel}`,
        icon: "circle-check",
        severity: status === "delivered" || status === "paid" ? "success" : "info",
        entity: { model: "Cart", id: updatedCart._id, label: orderCode },
      });
    } else {
      const tableLabel = await buildTableLabel(updatedCart.table);

      await notificationUtils.createNotification({
        req,
        category: "orders",
        action: "updated",
        title: "Orden modificada",
        message: (actor) =>
          `${actor.name} modificó la orden ${orderCode}${tableLabel ? ` de la ${tableLabel}` : ""}`,
        icon: "pen-to-square",
        severity: "info",
        entity: { model: "Cart", id: updatedCart._id, label: orderCode },
      });
    }

    return res.status(200).json({ message: "Cart updated successfully", data: updatedCart });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Elimina un carrito de compras usando su ID
cartController.deleteCart = async (req, res) => {
  try {
    const cart = await cartModel.findByIdAndDelete(req.params.id);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const orderCode = buildOrderCode(cart._id);
    const tableLabel = await buildTableLabel(cart.table);

    await notificationUtils.createNotification({
      req,
      category: "orders",
      action: "deleted",
      title: "Orden cancelada",
      message: (actor) =>
        `${actor.name} canceló la orden ${orderCode}${tableLabel ? ` de la ${tableLabel}` : ""}`,
      icon: "trash",
      severity: "danger",
      entity: { model: "Cart", id: cart._id, label: orderCode },
    });

    return res.status(200).json({ message: "Cart deleted" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default cartController;