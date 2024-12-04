const express = require('express');
const expenseController = require('../controllers/expense');
const userauthenticate = require('../middleware/auth');
const router = express.Router();

router.get('/', userauthenticate, expenseController.getAllExpenses);
router.post('/', userauthenticate, expenseController.addExpense);
router.put('/:id', userauthenticate, expenseController.updateExpense);
router.delete('/:id', userauthenticate, expenseController.deleteExpense);
router.get('/download', userauthenticate, expenseController.downloadexpense);


module.exports = router;