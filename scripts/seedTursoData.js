require('dotenv').config();
const { connectTurso, getDB } = require('../src/utils/turso');
const { v4: uuidv4 } = require('uuid');

const sampleContacts = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@techstart.io',
    phone: '+1-555-0101',
    company: 'TechStart Inc',
    status: 'lead',
    source: 'website',
    value: 50000,
    score: 85,
    notes: 'Interested in enterprise plan',
    tags: JSON.stringify(['enterprise', 'hot-lead'])
  },
  {
    name: 'Michael Chen',
    email: 'mchen@innovate.com',
    phone: '+1-555-0102',
    company: 'Innovate Labs',
    status: 'qualified',
    source: 'referral',
    value: 75000,
    score: 92,
    notes: 'Ready to schedule demo',
    tags: JSON.stringify(['demo-scheduled', 'high-value'])
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily@growthco.com',
    phone: '+1-555-0103',
    company: 'Growth Co',
    status: 'customer',
    source: 'linkedin',
    value: 125000,
    score: 95,
    notes: 'Long-term customer, very satisfied',
    tags: JSON.stringify(['customer', 'advocate'])
  }
];

const sampleDeals = [
  {
    title: 'Enterprise Plan - TechStart',
    amount: 50000,
    stage: 'proposal',
    probability: 70,
    expected_close_date: '2024-03-15',
    notes: 'Waiting for decision from board'
  },
  {
    title: 'Annual Subscription - Innovate',
    amount: 75000,
    stage: 'negotiation',
    probability: 85,
    expected_close_date: '2024-02-28',
    notes: 'Price negotiation in progress'
  },
  {
    title: 'Renewal - Growth Co',
    amount: 125000,
    stage: 'closed-won',
    probability: 100,
    expected_close_date: '2024-01-15',
    notes: 'Successfully renewed for another year'
  }
];

const sampleInventory = [
  {
    sku: 'TECH-001',
    name: 'Premium Software License',
    category: 'Software',
    quantity: 50,
    min_quantity: 20,
    cost: 100,
    price: 199,
    supplier: 'SoftwareCorp',
    location: 'Digital'
  },
  {
    sku: 'TECH-002',
    name: 'Enterprise API Access',
    category: 'API',
    quantity: 15,
    min_quantity: 10,
    cost: 500,
    price: 999,
    supplier: 'Internal',
    location: 'Cloud'
  },
  {
    sku: 'HW-001',
    name: 'Developer Kit',
    category: 'Hardware',
    quantity: 8,
    min_quantity: 15,
    cost: 200,
    price: 399,
    supplier: 'TechSupply Co',
    location: 'Warehouse A'
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting Turso database seeding...');
    
    await connectTurso();
    const db = getDB();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db.execute('DELETE FROM contacts');
    await db.execute('DELETE FROM deals');
    await db.execute('DELETE FROM inventory');
    
    // Seed contacts
    console.log('👥 Seeding contacts...');
    const contactIds = [];
    for (const contact of sampleContacts) {
      const id = uuidv4();
      contactIds.push(id);
      await db.execute({
        sql: `INSERT INTO contacts (id, name, email, phone, company, status, source, value, score, notes, tags) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, contact.name, contact.email, contact.phone, contact.company, contact.status, 
               contact.source, contact.value, contact.score, contact.notes, contact.tags]
      });
    }
    console.log(`✅ Created ${sampleContacts.length} contacts`);
    
    // Seed deals (link to contacts)
    console.log('💼 Seeding deals...');
    for (let i = 0; i < sampleDeals.length; i++) {
      const deal = sampleDeals[i];
      const id = uuidv4();
      await db.execute({
        sql: `INSERT INTO deals (id, title, contact_id, amount, stage, probability, expected_close_date, notes) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, deal.title, contactIds[i] || null, deal.amount, deal.stage, 
               deal.probability, deal.expected_close_date, deal.notes]
      });
    }
    console.log(`✅ Created ${sampleDeals.length} deals`);
    
    // Seed inventory
    console.log('📦 Seeding inventory...');
    for (const item of sampleInventory) {
      const id = uuidv4();
      await db.execute({
        sql: `INSERT INTO inventory (id, sku, name, category, quantity, min_quantity, cost, price, supplier, location, last_restock_date) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [id, item.sku, item.name, item.category, item.quantity, item.min_quantity, 
               item.cost, item.price, item.supplier, item.location]
      });
    }
    console.log(`✅ Created ${sampleInventory.length} inventory items`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${sampleContacts.length} contacts`);
    console.log(`   - ${sampleDeals.length} deals`);
    console.log(`   - ${sampleInventory.length} inventory items`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
