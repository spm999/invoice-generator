# **Invoice Generator**

This is a simple invoice generator application built using Node.js, Express.js, Handlebars, and Puppeteer. It generates invoices in PDF format based on the provided data.

## **Features:**

* Generates invoices in PDF format.
* Calculates total amounts, tax amounts, and net amounts automatically.
* Converts the total amount to words.
* Includes seller, billing, and shipping details.
* Supports multiple items with descriptions, unit prices, quantities, discounts, and tax rates.
* Handles situations where discounts are not provided for an item.
* Computes tax types based on the place of supply and place of delivery.

### **Installation:**

1. Clone the repository: `git clone https://github.com/spm999/invoice-generator.git`
2. Install dependencies:  `npm install`

### **Usage:**

1. Modify the `data.js` file in the `data` directory to provide your invoice details.
2. Run the application: `npm start`
3. Access the application in your web browser at `http://localhost:3000/generate-invoice`

### **Contributing:**

Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or create a pull request.
