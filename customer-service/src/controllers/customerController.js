const Customer = require('../models/Customer');

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().select('-password');
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
};

// Get a single customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Error fetching customer', error: error.message });
  }
};

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    // Check if customer with same email already exists
    const existingCustomer = await Customer.findOne({ email: req.body.email });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this email already exists' });
    }
    
    const customer = new Customer(req.body);
    const savedCustomer = await customer.save();
    
    // Remove password from response
    const customerResponse = savedCustomer.toObject();
    delete customerResponse.password;
    
    res.status(201).json(customerResponse);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
  try {
    // Don't allow password update through this endpoint
    if (req.body.password) {
      delete req.body.password;
    }
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
};

// Add address to customer
exports.addAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // If this is the first address or marked as default, set as default
    if (customer.addresses.length === 0 || req.body.isDefault) {
      // If this address is default, set all others to not default
      if (req.body.isDefault) {
        customer.addresses.forEach(address => {
          address.isDefault = false;
        });
      } else {
        // If it's the first address, mark it as default
        req.body.isDefault = true;
      }
    }
    
    customer.addresses.push(req.body);
    customer.updatedAt = Date.now();
    
    await customer.save();
    
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: 'Error adding address', error: error.message });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Verify current password
    const isMatch = await customer.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    customer.password = newPassword;
    await customer.save();
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
};