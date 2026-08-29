const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
const { createObjectCsvWriter } = require('csv-writer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Export to CSV
router.get('/csv', async (req, res) => {
    try {
        const data = await Return.find();
        const csvPath = path.join(__dirname, '../uploads/returns.csv');
        
        const csvWriter = createObjectCsvWriter({
            path: csvPath,
            header: [
                { id: 'productName', title: 'Product Name' },
                { id: 'category', title: 'Category' },
                { id: 'returnReason', title: 'Reason' },
                { id: 'status', title: 'Status' },
                { id: 'warehouse', title: 'Warehouse' },
                { id: 'returnDate', title: 'Return Date' }
            ]
        });

        await csvWriter.writeRecords(data);
        res.download(csvPath, 'returns_report.csv', () => {
            fs.unlinkSync(csvPath);
        });
    } catch (err) {
        res.status(500).json({ message: 'CSV export failed' });
    }
});

// Export to Excel
router.get('/excel', async (req, res) => {
    try {
        const data = await Return.find();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Returns');

        worksheet.columns = [
            { header: 'Product Name', key: 'productName', width: 25 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Reason', key: 'returnReason', width: 25 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Warehouse', key: 'warehouse', width: 12 },
            { header: 'Return Date', key: 'returnDate', width: 15 }
        ];

        data.forEach(item => worksheet.addRow(item));

        const excelPath = path.join(__dirname, '../uploads/returns.xlsx');
        await workbook.xlsx.writeFile(excelPath);
        
        res.download(excelPath, 'returns_report.xlsx', () => {
            fs.unlinkSync(excelPath);
        });
    } catch (err) {
        res.status(500).json({ message: 'Excel export failed' });
    }
});

module.exports = router;
