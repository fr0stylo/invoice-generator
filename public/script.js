// Set today's date as default
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('issueDate').value = today;
    
    // Set due date to 30 days from today
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
    
    // Generate default invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}-001`;
    document.getElementById('invoiceNumber').value = invoiceNumber;
});

// Add new item row
function addItem() {
    const container = document.getElementById('itemsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'item-row';
    newRow.innerHTML = `
        <div class="form-group">
            <label>Description *</label>
            <input type="text" name="itemDescription" required>
        </div>
        <div class="form-group">
            <label>Period</label>
            <input type="text" name="itemPeriod">
        </div>
        <div class="form-group">
            <label>Quantity *</label>
            <input type="number" name="itemQty" value="1" min="0.01" step="0.01" required>
        </div>
        <div class="form-group">
            <label>Unit Price (€) *</label>
            <input type="number" name="itemPrice" min="0" step="0.01" required>
        </div>
        <div>
            <button type="button" class="btn btn-danger" onclick="removeItem(this)">Remove</button>
        </div>
    `;
    container.appendChild(newRow);
}

// Remove item row
function removeItem(button) {
    const container = document.getElementById('itemsContainer');
    if (container.children.length > 1) {
        button.closest('.item-row').remove();
    } else {
        showError('At least one item is required');
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 5000);
}

// Show loading state
function showLoading(show) {
    const loadingDiv = document.querySelector('.loading');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (show) {
        loadingDiv.style.display = 'block';
        submitButton.disabled = true;
        submitButton.textContent = 'Generating...';
    } else {
        loadingDiv.style.display = 'none';
        submitButton.disabled = false;
        submitButton.textContent = 'Generate Invoice PDF';
    }
}

// Collect form data
function collectFormData() {
    const formData = {
        invoiceNumber: document.getElementById('invoiceNumber').value,
        issueDate: document.getElementById('issueDate').value,
        dueDate: document.getElementById('dueDate').value,
        taxRate: parseFloat(document.getElementById('taxRate').value) || 0,
        sender: {
            name: document.getElementById('senderName').value,
            entityNumber: document.getElementById('senderEntityNumber').value,
            address: document.getElementById('senderAddress').value,
            city: document.getElementById('senderCity').value,
            country: document.getElementById('senderCountry').value,
            phone: document.getElementById('senderPhone').value,
            iban: document.getElementById('senderIban').value
        },
        billTo: {
            name: document.getElementById('billToName').value,
            companyNumber: document.getElementById('billToCompanyNumber').value,
            address: document.getElementById('billToAddress').value,
            city: document.getElementById('billToCity').value,
            state: document.getElementById('billToState').value,
            zip: document.getElementById('billToZip').value,
            country: document.getElementById('billToCountry').value
        },
        items: [],
        timesheets: []
    };

    // Collect items
    const itemRows = document.querySelectorAll('.item-row');
    itemRows.forEach(row => {
        const description = row.querySelector('input[name="itemDescription"]').value;
        const period = row.querySelector('input[name="itemPeriod"]').value;
        const qty = parseFloat(row.querySelector('input[name="itemQty"]').value);
        const unitPrice = parseFloat(row.querySelector('input[name="itemPrice"]').value);

        if (description && !isNaN(qty) && !isNaN(unitPrice)) {
            formData.items.push({
                description,
                period: period || '',
                qty,
                unitPrice
            });
        }
    });

    return formData;
}

// Validate form data
function validateFormData(data) {
    const errors = [];

    // Required sender fields
    if (!data.sender.name) errors.push('Sender name is required');
    if (!data.sender.entityNumber) errors.push('Sender entity number is required');
    if (!data.sender.address) errors.push('Sender address is required');
    if (!data.sender.city) errors.push('Sender city is required');
    if (!data.sender.country) errors.push('Sender country is required');

    // Required bill-to fields
    if (!data.billTo.name) errors.push('Bill-to name is required');
    if (!data.billTo.address) errors.push('Bill-to address is required');
    if (!data.billTo.city) errors.push('Bill-to city is required');
    if (!data.billTo.country) errors.push('Bill-to country is required');

    // Invoice details
    if (!data.invoiceNumber) errors.push('Invoice number is required');
    if (!data.issueDate) errors.push('Issue date is required');
    if (!data.dueDate) errors.push('Due date is required');

    // Items
    if (data.items.length === 0) errors.push('At least one item is required');

    return errors;
}

// Handle form submission
document.getElementById('invoiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Hide previous messages
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    
    // Collect and validate form data
    const formData = collectFormData();
    const errors = validateFormData(formData);
    
    if (errors.length > 0) {
        showError(errors.join(', '));
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/generate-invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            // Get the PDF blob
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice_${formData.invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showSuccess('Invoice generated and downloaded successfully!');
        } else {
            const errorData = await response.json();
            showError(errorData.error || 'Failed to generate invoice');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Network error occurred. Please try again.');
    } finally {
        showLoading(false);
    }
});