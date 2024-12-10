// DOM Elements
const elements = {
  expenseList: document.getElementById('expense-list'),
  addExpenseButton: document.getElementById('add-expense'),
  purchasePremiumButton: document.getElementById('purchase-premium'),
  purchaseButton: document.getElementById('purchase'),
  leaderboardButton: document.getElementById('show-leaderboard-btn'),
  leaderboardList: document.getElementById('leaderboard-list'),
  amountInput: document.getElementById('amount-input'),
  descriptionInput: document.getElementById('description-input'),
  categorySelect: document.getElementById('category-select'),
  downloadButton: document.getElementById('download-expenses'),
  rowsPerPageInput: document.getElementById('rowsPerPage'),
  prevButton: document.getElementById('prevPageBtn'),  
  nextButton: document.getElementById('nextPageBtn'),
  paginationInfo: document.getElementById('pagination-info'),
  downloadHistoryTable: document.getElementById('ui2'), 
};

let expenses = [];
let editingIndex = -1;
let currentPage = 1;
let rowsPerPage = 5;

const getAuthToken = () => localStorage.getItem('token');

const updatePremiumUI = (isPremium) => {
  elements.purchaseButton.style.display = isPremium ? 'block' : 'none';
  elements.purchasePremiumButton.style.display = isPremium ? 'none' : 'block';
};


if (elements.prevButton) {
  elements.prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchExpenses();
    }
  });
}

if (elements.nextButton) {
  elements.nextButton.addEventListener('click', () => {
    currentPage++;
    fetchExpenses();
  });
}

if (elements.rowsPerPageInput) {
  elements.rowsPerPageInput.addEventListener('change', () => {
    rowsPerPage = parseInt(elements.rowsPerPageInput.value, 10);
    currentPage = 1;
    fetchExpenses();
  });
}

const fetchExpenses = async () => {
  const token = getAuthToken();
  if (!token) {
    console.error('No authorization token found.');
    return;
  }
  
  try {
    const response = await axios.get(`http://localhost:3000/expenses?page=${currentPage}&limit=${rowsPerPage}`, {
      headers: { Authorization: token },
    });

    const { expenses: fetchedExpenses, totalCount, hasPrevPage, hasNextPage, ispremium } = response.data;

    expenses = fetchedExpenses;
    updatePremiumUI(ispremium);
    renderExpenses(totalCount); 

    if (elements.prevButton && elements.nextButton) {
      elements.prevButton.disabled = !hasPrevPage;
      elements.nextButton.disabled = !hasNextPage;
    }

  } catch (error) {
    console.error('Error fetching expenses:', error);
    
  }
};

const handleAddOrUpdateExpense = async () => {
  const amount = elements.amountInput.value;
  const description = elements.descriptionInput.value;
  const category = elements.categorySelect.value;
  const token = getAuthToken();

  if (!amount || !description || !category) {
    alert('Please fill in all the details');
    return;
  }

  const newExpense = { amount, description, category };

  try {
    let response;
    if (editingIndex === -1) {
      response = await axios.post('http://localhost:3000/expenses', newExpense, {
        headers: { Authorization: token },
      });

      const addedExpense = response.data;
      expenses.push(addedExpense);
    } else {
      const id = expenses[editingIndex].id;
      response = await axios.put(`http://localhost:3000/expenses/${id}`, newExpense, {
        headers: { Authorization: token },
      });

      const updatedExpense = response.data;
      expenses[editingIndex] = updatedExpense;
      editingIndex = -1;
    }

    fetchExpenses();
  } catch (error) {
    console.error('Error adding/updating expense:', error);
    alert('An error occurred. Please try again.');
  } finally {
    resetInputs();
  }
};

const resetInputs = () => {
  elements.amountInput.value = '';
  elements.descriptionInput.value = '';
  elements.categorySelect.value = '';
};

const renderExpenses = (totalCount) => {
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  elements.paginationInfo.innerHTML = `Page ${currentPage} of ${totalPages}`;

  elements.expenseList.innerHTML = ''; 

  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${expense.amount}</td>
      <td>${expense.description || "No description"}</td>
      <td>${expense.category}</td>
      <td>
        <button class="delete-btn" data-id="${expense.id}">Delete 🗑️</button>
        <button class="edit-btn" data-index="${i}">Edit ✏️</button>
      </td>
    `;
    elements.expenseList.appendChild(row);
  }
};


const handleDeleteExpense = async (id) => {
  const token = getAuthToken();

  try {
    const response = await axios.delete(`http://localhost:3000/expenses/${id}`, {
      headers: { Authorization: token },
    });

    expenses = expenses.filter(expense => expense.id !== parseInt(id, 10));
    renderExpenses();
  } catch (error) {
    console.error('Error deleting expense:', error);
    if (error.response && error.response.status === 404) {
      alert('Expense not found!');
    } else {
    }
  }
};

const handleEditExpense = (index) => {
  const expense = expenses[index];
  elements.amountInput.value = expense.amount;
  elements.descriptionInput.value = expense.description;
  elements.categorySelect.value = expense.category;
  editingIndex = index;
};

async function handlePurchase(e) {
  e.preventDefault();

  const token = getAuthToken();
  if (!token) {
    alert('You need to be logged in to make a purchase');
    return;
  }

  try {
    const response = await axios.get('http://localhost:3000/premium/premiummembership', {
      headers: { Authorization: token },
    });

    const { order: { id: orderid }, key_id } = response.data;

    const options = {
      key: key_id,
      order_id: orderid,
      handler: async function (response) {
        const payment = {
          msg: 'successful',
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
        };

        try {
          const verification = await axios.post(
            'http://localhost:3000/premium/updatetransactionstatus',
            payment,
            { headers: { Authorization: token } }
          );

          if (verification.data.success) {
            alert('Payment successful! You are now a premium user.');

            localStorage.setItem('isPremium', 'true');
            updatePremiumUI(true);
          } else {
            console.error('Payment verification failed.');
          }
        } catch (err) {
          console.error('Error verifying payment:', err);
          
        }
      },
      modal: {
        ondismiss: function () {
          alert('Payment was cancelled. Please try again.');
        },
      },
    };

    const rzp1 = new Razorpay(options);
    rzp1.open();
  } catch (error) {
    console.error('Error initiating purchase:', error);
    alert('Payment initiation failed. Please try again.');
  }
}


const fetchLeaderboard = async () => {
  const token = getAuthToken();

  try {
    const response = await axios.get('http://localhost:3000/expenses/showLeaderBoard', {
      headers: { Authorization: token },
    });

    elements.leaderboardList.innerHTML = response.data.map((user, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${user.username}</td>
        <td>₹${user.totalExpense}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    alert('Failed to load leaderboard.');
  }
};

const handleDownloadExpenses = async () => {
  const token = getAuthToken();

  try {
    const response = await axios.get('http://localhost:3000/expenses/download', {
      headers: { Authorization: token },
      responseType: 'blob',  
    });

    const blob = response.data;
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.href = url;
    link.download = 'my-expenses.txt';
    link.click();
    window.URL.revokeObjectURL(url); 
  } catch (error) {
    console.error('Error downloading expenses:', error);
    alert('Failed to download expenses.');
  }
};

const fetchDownload = async () => {
  const token = getAuthToken();
  if (!token) {
    console.error('No authorization token found.');
    return;
  }

  try {
    const response = await axios.get('http://localhost:3000/expenses/getdownload', {
      headers: { Authorization: token },
    });

    elements.downloadHistoryTable.innerHTML = ''; 
    response.data.forEach((item, index) => {
      const { link } = item;
      addHistory(index + 1, link);
    });
  } catch (error) {
    console.error('Error fetching download history:', error);
  }
};

const addHistory = (sni, link) => {
  const newTr = document.createElement('tr');
  newTr.innerHTML = `
    <td>${sni}</td>
    <td><a href="${link}" target="_blank">${link}</a></td>
  `;
  elements.downloadHistoryTable.appendChild(newTr);
};

fetchDownload();

const downloadHistoryButton = document.getElementById('refresh-history-btn');
if (downloadHistoryButton) {
  downloadHistoryButton.addEventListener('click', fetchDownload);
}

elements.downloadButton.addEventListener('click', handleDownloadExpenses);
elements.addExpenseButton.addEventListener('click', handleAddOrUpdateExpense);
elements.expenseList.addEventListener('click', (event) => {
  if (event.target.classList.contains('delete-btn')) {
    handleDeleteExpense(event.target.getAttribute('data-id'));
  }
  if (event.target.classList.contains('edit-btn')) {
    handleEditExpense(event.target.getAttribute('data-index'));
  }
});
elements.purchasePremiumButton.addEventListener('click', handlePurchase);
elements.leaderboardButton.addEventListener('click', fetchLeaderboard);

fetchExpenses();
