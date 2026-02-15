/**
 * Sample Data Seeder for StartupCRM
 * Run with: node scripts/seedData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Contact = require('../src/models/Contact');
const Deal = require('../src/models/Deal');
const Inventory = require('../src/models/Inventory');
const User = require('../src/models/User');

// Sample data
const sampleUser = {
  name: 'Demo User',
  email: 'demo@startupcrm.com',
  password: 'Demo123!',
  role: 'admin'
};

const sampleContacts = [
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@techcorp.com',
    phone: '+1-555-0101',
    company: 'TechCorp Industries',
    position: 'CTO',
    industry: 'Technology',
    status: 'customer',
    source: 'referral',
    tags: ['enterprise', 'tech', 'priority'],
    dealValue: 150000,
    score: 95
  },
  {
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@innovate.io',
    phone: '+1-555-0102',
    company: 'Innovate.io',
    position: 'CEO',
    industry: 'SaaS',
    status: 'prospect',
    source: 'website',
    tags: ['startup', 'saas', 'high-potential'],
    dealValue: 75000,
    score: 88
  },
  {
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.r@globaltech.com',
    phone: '+1-555-0103',
    company: 'GlobalTech Solutions',
    position: 'VP of Operations',
    industry: 'Technology',
    status: 'lead',
    source: 'cold_outreach',
    tags: ['enterprise', 'ops'],
    dealValue: 50000,
    score: 72
  },
  {
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@startup.co',
    phone: '+1-555-0104',
    company: 'Startup Co.',
    position: 'Founder',
    industry: 'Fintech',
    status: 'lead',
    source: 'event',
    tags: ['founder', 'fintech', 'early-stage'],
    dealValue: 25000,
    score: 65
  },
  {
    firstName: 'Jessica',
    lastName: 'Williams',
    email: 'jessica.w@megacorp.com',
    phone: '+1-555-0105',
    company: 'MegaCorp International',
    position: 'Director of Technology',
    industry: 'Enterprise',
    status: 'prospect',
    source: 'referral',
    tags: ['enterprise', 'decision-maker'],
    dealValue: 200000,
    score: 92
  }
];

const sampleInventoryItems = [
  {
    sku: 'WIDGET-PRO-001',
    name: 'Premium Widget Pro',
    description: 'High-quality professional widget',
    category: 'Widgets',
    quantity: 150,
    reorderPoint: 30,
    reorderQuantity: 100,
    unitPrice: 49.99,
    costPrice: 25.00,
    status: 'in_stock',
    supplier: {
      name: 'Global Supplies Inc',
      contactPerson: 'John Smith',
      email: 'john@globalsupplies.com',
      phone: '+1-555-0200'
    },
    location: {
      warehouse: 'Main',
      aisle: 'A',
      shelf: '3'
    },
    tags: ['premium', 'best-seller']
  },
  {
    sku: 'GADGET-STD-002',
    name: 'Standard Gadget',
    description: 'Reliable standard gadget',
    category: 'Gadgets',
    quantity: 8,
    reorderPoint: 15,
    reorderQuantity: 50,
    unitPrice: 29.99,
    costPrice: 15.00,
    status: 'low_stock',
    supplier: {
      name: 'Tech Distributors LLC',
      contactPerson: 'Maria Garcia',
      email: 'maria@techdist.com',
      phone: '+1-555-0201'
    },
    location: {
      warehouse: 'Main',
      aisle: 'B',
      shelf: '1'
    },
    tags: ['standard', 'popular']
  },
  {
    sku: 'DEVICE-ULT-003',
    name: 'Ultimate Device',
    description: 'Top-of-the-line device',
    category: 'Devices',
    quantity: 75,
    reorderPoint: 20,
    reorderQuantity: 50,
    unitPrice: 99.99,
    costPrice: 50.00,
    status: 'in_stock',
    supplier: {
      name: 'Premium Goods Co',
      contactPerson: 'Robert Lee',
      email: 'robert@premiumgoods.com',
      phone: '+1-555-0202'
    },
    location: {
      warehouse: 'Main',
      aisle: 'A',
      shelf: '5'
    },
    tags: ['premium', 'new']
  },
  {
    sku: 'TOOL-ECO-004',
    name: 'Economy Tool',
    description: 'Budget-friendly tool',
    category: 'Tools',
    quantity: 0,
    reorderPoint: 25,
    reorderQuantity: 100,
    unitPrice: 19.99,
    costPrice: 8.00,
    status: 'out_of_stock',
    supplier: {
      name: 'Budget Supplies',
      contactPerson: 'Lisa Chen',
      email: 'lisa@budgetsupplies.com',
      phone: '+1-555-0203'
    },
    location: {
      warehouse: 'Main',
      aisle: 'C',
      shelf: '2'
    },
    tags: ['economy', 'budget']
  },
  {
    sku: 'ACCESS-PRO-005',
    name: 'Professional Accessory',
    description: 'Professional-grade accessory',
    category: 'Accessories',
    quantity: 200,
    reorderPoint: 40,
    reorderQuantity: 150,
    unitPrice: 14.99,
    costPrice: 7.00,
    status: 'in_stock',
    supplier: {
      name: 'Accessory World',
      contactPerson: 'Tom Anderson',
      email: 'tom@accessoryworld.com',
      phone: '+1-555-0204'
    },
    location: {
      warehouse: 'Secondary',
      aisle: 'D',
      shelf: '1'
    },
    tags: ['accessory', 'high-volume']
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...');
    
    // Connect to database
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/startupcrm');
    console.log('✅ Connected to database');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await Contact.deleteMany({});
    await Deal.deleteMany({});
    await Inventory.deleteMany({});
    await User.deleteMany({ email: sampleUser.email });

    // Create demo user
    console.log('👤 Creating demo user...');
    const user = new User(sampleUser);
    await user.save();
    console.log(`✅ Created user: ${user.email} (password: ${sampleUser.password})`);

    // Create contacts
    console.log('👥 Creating contacts...');
    const contacts = await Contact.insertMany(
      sampleContacts.map(contact => ({ ...contact, userId: user._id }))
    );
    console.log(`✅ Created ${contacts.length} contacts`);

    // Create deals
    console.log('💼 Creating deals...');
    const sampleDeals = [
      {
        userId: user._id,
        contactId: contacts[0]._id,
        title: 'Enterprise License Agreement',
        description: 'Full enterprise license with support',
        value: 150000,
        stage: 'negotiation',
        probability: 85,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        products: [
          { name: 'Premium Widget Pro', quantity: 500, price: 49.99, total: 24995 },
          { name: 'Professional Accessory', quantity: 1000, price: 14.99, total: 14990 }
        ]
      },
      {
        userId: user._id,
        contactId: contacts[1]._id,
        title: 'SaaS Pilot Program',
        description: '3-month pilot for SaaS solution',
        value: 75000,
        stage: 'proposal',
        probability: 70,
        expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        products: [
          { name: 'Ultimate Device', quantity: 100, price: 99.99, total: 9999 }
        ]
      },
      {
        userId: user._id,
        contactId: contacts[2]._id,
        title: 'Operations Upgrade Package',
        description: 'Upgrade to premium operations tools',
        value: 50000,
        stage: 'qualification',
        probability: 60,
        expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      {
        userId: user._id,
        contactId: contacts[4]._id,
        title: 'MegaCorp Technology Overhaul',
        description: 'Complete technology infrastructure update',
        value: 200000,
        stage: 'prospecting',
        probability: 40,
        expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    ];

    const deals = await Deal.insertMany(sampleDeals);
    console.log(`✅ Created ${deals.length} deals`);

    // Create inventory items
    console.log('📦 Creating inventory items...');
    const inventory = await Inventory.insertMany(
      sampleInventoryItems.map(item => ({ ...item, userId: user._id }))
    );
    console.log(`✅ Created ${inventory.length} inventory items`);

    // Summary
    console.log('\n🎉 Data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   👤 User: ${user.email}`);
    console.log(`   👥 Contacts: ${contacts.length}`);
    console.log(`   💼 Deals: ${deals.length}`);
    console.log(`   📦 Inventory Items: ${inventory.length}`);
    console.log(`   💰 Total Pipeline Value: $${deals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}\n`);
    
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${sampleUser.email}`);
    console.log(`   Password: ${sampleUser.password}\n`);
    
    console.log('🚀 You can now start the application and login!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
    process.exit(0);
  }
}

// Run seeder
seedData();
