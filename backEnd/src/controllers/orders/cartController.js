import cartModel from "../../models/orders/cartModel.js";
import combosModel from "../../models/menu/combosModel.js";
import drinksModel from "../../models/menu/drinksModel.js";
import extrasModel from "../../models/menu/extrasModel.js";

const cartController = {};

cartController.getAllCarts = async (req, res) => {
  try {
    const carts = await cartModel
      .find()
      .populate("idCustomer", "name email")
      .populate("details.combos.comboId", "name price")
      .populate("details.extras.extraId", "name price")
      .populate("details.extras.drinks.drinkId", "name price");
    return res.status(200).json(carts);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


cartController.getCartById = async (req, res) => {
  try {
    const cart = await cartModel
      .findById(req.params.id)
      .populate("idCustomer", "name email")
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


cartController.insertCart = async (req, res) => {
  try {
    const { idCustomer, details, status } = req.body;

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
      details: processedDetails,
      total: totalGeneral,
      status
    });

    await newCart.save();
    return res.status(201).json({ message: "Cart saved successfully", data: newCart });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


cartController.updateCart = async (req, res) => {
  try {
    const { idCustomer, details, status } = req.body;

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

    const updatedCart = await cartModel.findByIdAndUpdate(
      req.params.id,
      {
        idCustomer,
        details: processedDetails,
        total: totalGeneral,
        status
      },
      { new: true }
    );

    if (!updatedCart) return res.status(404).json({ message: "Cart not found" });

    return res.status(200).json({ message: "Cart updated successfully", data: updatedCart });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE
cartController.deleteCart = async (req, res) => {
  try {
    const cart = await cartModel.findByIdAndDelete(req.params.id);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    return res.status(200).json({ message: "Cart deleted" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default cartController;