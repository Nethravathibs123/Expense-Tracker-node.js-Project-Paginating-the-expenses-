  const Expense = require('../models/expense');
  const Users = require('../models/user');
  const Sequelize = require('../util/database'); 
  const AWS=require('aws-sdk');
  const DownloadHistory = require('../models/downloadhistory');
  const expenseService = require('../services/expenseService');  

  module.exports.getAllExpenses = async (req, res, next) => {
    try {
      const { expenses, totalCount, hasPrevPage, hasNextPage } = await expenseService.getAllExpenses(req);
      res.status(200).json({
        expenses,
        totalCount,
        hasPrevPage,
        hasNextPage,
        ispremium: req.user.ispremium,
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ msg: "Internal server error" });
    }
  };
  
  exports.addExpense = async (req, res) => {
    try {
      const expense = await expenseService.addExpense(req.user.id, req.body);
      res.status(201).json({ id: expense.id, expense });
    } catch (error) {
      console.error("Error adding expense:", error);
      res.status(400).json({ msg: error.message || "Failed to add expense" });
    }
  };
  
  exports.updateExpense = async (req, res) => {
    const expenseId = req.params.id;
    try {
      const expense = await expenseService.updateExpense(expenseId, req.body);
      res.status(200).json({ id: expense.id, expense });
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(400).json({ msg: error.message || "Failed to update expense" });
    }
  };

  module.exports.deleteExpense = async (req, res, next) => {
    console.log('User:', req.user); 
    console.log('Expense ID:', req.params.id); 
  
    try {
      await expenseService.deleteExpense(req.user.id, req.params.id);
      res.status(203).json({ msg: "Expense removed successfully" });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ msg: "An error occurred while deleting the expense" });
    }
  };
  
  module.exports.downloadExpense = async (req, res, next) => {
    try {
      const fileURL = await expenseService.downloadExpense(req.user.id);
      res.status(200).json({ fileURL, success: true });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  module.exports.getDownload = async (req, res, next) => {
    try {
      const links = await DownloadHistory.findAll({ where: { userId: req.user.id } });
      res.status(200).send(JSON.stringify(links));
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ msg: "Internal server error" });
    }
  };

  exports.getUserLeaderBoard = async (req, res) => {
    try {
      
      const leaderboard = await Users.findAll({
        attributes: [ 'id',  'username', [Sequelize.fn('SUM', Sequelize.col('expenses.amount')), 'totalExpense'] ],
        include: [{ model: Expense, attributes: [],}],
        group: ['user-detail.id'],  
        order: [[Sequelize.fn('SUM', Sequelize.col('expenses.amount')), 'DESC']],  
      }); 
      res.status(200).json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ message: 'Failed to load leaderboard.' });
    }
  };