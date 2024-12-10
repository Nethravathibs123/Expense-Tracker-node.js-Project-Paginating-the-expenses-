const Razorpay = require('razorpay');
const Order = require('../models/order');
const User = require('../models/user');
const sequelize = require('../util/database');

module.exports.purchaseMembership = async (req, res) => {
   
  try {
     const userId = req.user.id;
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  
    const amount = 1000;
    
    const t = await sequelize.transaction();
  
    const order = await new Promise((resolve, reject) => {
      rzp.orders.create({ amount, currency: 'INR' }, (err, order) => {
        if (err) {
          return reject(new Error(JSON.stringify(err)));
        }
        resolve(order);
      });
    });
  
    console.log('Razorpay Order:', order);
    await req.user.createOrder(
      { orderId: order.id, status: 'PENDING' },
      { transaction: t }
    );
    await t.commit();
    return { status: 201, order, key_id: rzp.key_id };
 
  } catch (err) {
    if (t) await t.rollback(); // Safely rollback
    console.error('Error creating Razorpay order:', err.message);
    return res.status(500).json({
      message: 'Order creation failed',
      error: JSON.stringify(err),
    });
    }
    
  }

  
module.exports.updateMembership = async (userId,orderId,msg,paymentId) => {
  const t = await sequelize.transaction(); 
  try {
    const order = await Order.findOne({ where: { orderId, userId }, transaction: t });

    if (!order) {
      await t.rollback();  
      return { status: 404, message: 'Order not found' };
    }

    const isSuccess = msg === 'successful';
    console.log('Updating order with paymentId:', paymentId);

    const orderUpdatePromise = order.update({
      status: isSuccess ? 'SUCCESSFUL' : 'FAILED',
      paymentId: isSuccess ? paymentId : null,
    }, { transaction: t });

    const userUpdatePromise = isSuccess 
    ? User.update({ ispremium: true }, { where: { id: userId }, transaction: t })
    : Promise.resolve();    
    await Promise.all([orderUpdatePromise, userUpdatePromise]);
    await t.commit();

    return {
        status: 200,
        message: isSuccess ? 'Payment successful' : 'Payment failed',
        premium: isSuccess,
      };
  
    } catch (err) {
      if (t) await t.rollback();
      console.error('Error updating membership:', err.message);
      return { status: 500, message: 'Internal server error', error: err.message };
    }
  };