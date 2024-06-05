const express = require('express');
const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const puppeteer = require('puppeteer');
const numWords = require('num-words');
const { data: invoiceData } = require('./data');

// Register a Handlebars helper to increment index
hbs.registerHelper('incrementedIndex', function (index) {
    return index + 1;
});

// Set up Express
const app = express();
app.use(express.json()); // To parse JSON bodies

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'templates'));

function getBase64Image(filePath) {
    const image = fs.readFileSync(filePath);
    return 'data:image/png;base64,' + image.toString('base64');
}

// Endpoint to generate invoice
app.post('/generate-invoice', async (req, res) => {
    // const data =req.body    //we can alternatively pas data using body
    const data = invoiceData; // Use imported data object

    // Add absolute path to logo and signature images
    data.company = getBase64Image(path.resolve(__dirname, './images/logo.png'));
    data.signature = getBase64Image(path.resolve(__dirname, './images/sig.png'));

    // Calculate derived values
    data.items.forEach(item => {
        item.netAmount = (item.unitPrice * item.quantity - (item.discount || 0)).toFixed(2);

        // Determine tax type
        if (data.placeOfSupply === data.placeOfDelivery) {
            item.taxType = 'CGST/SGST';
            item.cgst = (item.netAmount * 0.09).toFixed(2);
            item.sgst = (item.netAmount * 0.09).toFixed(2);
            item.taxAmount = (parseFloat(item.cgst) + parseFloat(item.sgst)).toFixed(2);
        } else {
            item.taxType = 'IGST';
            item.igst = (item.netAmount * 0.18).toFixed(2);
            item.taxAmount = item.igst;
        }

        item.totalAmount = (parseFloat(item.netAmount) + parseFloat(item.taxAmount)).toFixed(2);
    });

    // Calculate total amounts
    data.totalNetAmount = data.items.reduce((sum, item) => sum + parseFloat(item.netAmount), 0).toFixed(2);
    data.totalTaxAmount = data.items.reduce((sum, item) => sum + parseFloat(item.taxAmount), 0).toFixed(2);
    data.totalAmount = (parseFloat(data.totalNetAmount) + parseFloat(data.totalTaxAmount)).toFixed(2);

    // Validate totalAmount before converting to words
    const totalAmountNumber = parseFloat(data.totalAmount);
    if (isNaN(totalAmountNumber)) {
        console.error('Invalid total amount:', data.totalAmount);
        return res.status(400).send('Invalid total amount');
    }

    // Convert total amount to integer and log it
    const totalAmountInteger = Math.floor(totalAmountNumber);
    data.amountInWords = numWords(totalAmountInteger).toUpperCase();

    // Render HTML
    const html = await new Promise((resolve, reject) => {
        app.render('invoice', data, (err, html) => {
            if (err) {
                console.error('Error rendering HTML:', err);
                return reject(err);
            }
            resolve(html);
        });
    });

    // Generate PDF from HTML
    try {
        const browser = await puppeteer.launch({ headless: true, timeout: 120000, defaultViewport: null, args: ['--no-sandbox', '--disable-setuid-sandbox'] }); // 120 seconds timeout
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 600000 }); // 60 seconds timeout
        const pdf = await page.pdf({ format: 'A4', timeout: 600000 }); // 60 seconds timeout
        await browser.close();

        // Send PDF as response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
        res.send(pdf);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

// Start server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

