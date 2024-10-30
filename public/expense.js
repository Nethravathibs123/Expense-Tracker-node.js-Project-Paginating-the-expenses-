// Sample data and initial setup
const expenses = [
    { date: '2024-10-28', category: 'Food', description: 'Lunch', amount: 10 },
    { date: '2024-10-27', category: 'Transport', description: 'Train', amount: 5 },
    // Add more sample data
];
const expensesPerPage = 10;
let currentPage = 1;

function renderTable(page) {
    const start = (page - 1) * expensesPerPage;
    const end = page * expensesPerPage;
    const currentExpenses = expenses.slice(start, end);

    const tbody = document.getElementById('expense-table').querySelector('tbody');
    tbody.innerHTML = '';
    currentExpenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.category}</td>
            <td>${expense.description}</td>
            <td>$${expense.amount.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('page-info').textContent = `Page ${page} of ${Math.ceil(expenses.length / expensesPerPage)}`;
    document.getElementById('prev-btn').disabled = page === 1;
    document.getElementById('next-btn').disabled = page === Math.ceil(expenses.length / expensesPerPage);
}

function nextPage() {
    if (currentPage < Math.ceil(expenses.length / expensesPerPage)) {
        currentPage++;
        renderTable(currentPage);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable(currentPage);
    }
}

// Initialize
renderTable(currentPage);
