const purchaseService = require('../services/purchaseService');

module.exports.purchaseMembership = async (req, res) => {
  try {
    const result = await purchaseService.purchaseMembership(req);
    return res.status(result.status).json({
      order: result.order,
      key_id: result.key_id,
      message: result.message || 'Membership purchase initiated.',
      error: result.error || null,
    });
  } catch (err) {
    console.error('Error purchasing membership:', err.message);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};


module.exports.updateMembership = async (req, res) => {
  const userId = req.user.id;
  const { orderId, msg, paymentId } = req.body;

  try {
    const result = await purchaseService.updateMembership(userId, orderId, msg, paymentId);
    return res.status(result.status).json({
      message: result.message || 'Membership updated successfully.',
      error: result.error || null,
    });
  } catch (err) {
    console.error('Error updating membership:', err.message);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

module.exports.checkPremium = (req, res) => {
  try {
    const { ispremium } = req.user;

    if (ispremium) {
      return res.status(200).json({ check: true, message: 'Premium membership active.' });
    } else {
      return res.status(403).json({ check: false, message: 'No premium membership found.' });
    }
  } catch (err) {
    console.error('Error checking premium status:', err.message);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};
