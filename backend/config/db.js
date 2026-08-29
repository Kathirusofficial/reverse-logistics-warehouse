const mongoose = require('mongoose');
const User = require('../models/User');
const Return = require('../models/Return');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
    try {
        const mongoURI = 'mongodb://127.0.0.1:27017/warehouse_system_v2';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected to warehouse_system_v2');
        
        await seedData();
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
};

const seedData = async () => {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
        console.log('Seeding initial users...');
        const hashedPassword = await bcrypt.hash('1234', 10);
        await User.insertMany([
            { name: 'Admin User', email: 'admin@gmail.com', password: hashedPassword, role: 'admin', company: 'Warelytics' },
            { name: 'John Worker', email: 'worker@gmail.com', password: hashedPassword, role: 'worker', company: 'Warelytics' }
        ]);
    }

    const returnCount = await Return.countDocuments();
    if (returnCount === 0) {
        console.log('Seeding 30 varied return records...');
        const products = ['Laptop Pro', 'Smart Phone X', 'OLED TV', 'Running Shoes', 'Luxury Watch', 'Noise Headphones', 'Graphic Tablet', 'DSL Camera', 'Mechanical Keyboard', 'Gaming Monitor'];
        const categories = ['Electronics', 'Fashion', 'Appliances', 'Audio'];
        const warehouses = ['Chennai', 'Delhi', 'Mumbai'];
        const statuses = ['Received', 'Inspection', 'Repair', 'Resale', 'Scrap'];
        const reasons = ['Damaged Screen', 'Motherboard Failure', 'Wrong Size', 'Not Powering On', 'Battery Drainage', 'Package Damaged', 'Customer Mind Change'];
        
        const samples = [];
        const now = new Date();

        for (let i = 0; i < 30; i++) {
            const dateOffset = i * 2;
            const createdAt = new Date();
            createdAt.setDate(now.getDate() - dateOffset);

            const mfgDate = new Date();
            mfgDate.setFullYear(now.getFullYear() - 1);

            samples.push({
                productName: `${products[i % products.length]} - SN${1000 + i}`,
                category: categories[i % categories.length],
                productValue: Math.floor(Math.random() * 2000) + 50,
                returnReason: reasons[i % reasons.length],
                status: statuses[i % statuses.length],
                warehouse: warehouses[i % warehouses.length],
                section: ['A', 'B', 'C'][i % 3] + (i % 5 + 1),
                rack: 'R' + (i % 10 + 1),
                manufactureDate: mfgDate,
                returnDate: createdAt,
                company: 'Warelytics',
                createdAt: createdAt
            });
        }
        await Return.insertMany(samples);
        console.log('Seeding complete.');
    }
};

module.exports = connectDB;