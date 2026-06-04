const fs = require('fs');
const path = require('path');

// 1. Manually parse .env file to populate environment variables for Prisma Client
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    // Ignore comments and empty lines
    if (!line || line.startsWith('#')) return;
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      // Strip outer quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  try {
    bcrypt = require('bcryptjs');
  } catch (err) {
    console.error('Neither bcrypt nor bcryptjs could be loaded. Please ensure one of them is installed.');
    process.exit(1);
  }
}

async function main() {
  try {
    console.log('Checking database status...');
    
    const userJsonPath = path.join(__dirname, '../user.json');
    if (!fs.existsSync(userJsonPath)) {
      console.error('user.json file not found at:', userJsonPath);
      process.exit(1);
    }
    
    const usersData = JSON.parse(fs.readFileSync(userJsonPath, 'utf-8'));
    let createdCount = 0;
    
    for (const userData of usersData) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
          }
        });
        console.log(`Created default user: ${userData.email}`);
        createdCount++;
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }
    
    if (createdCount > 0) {
      console.log(`Seeding complete. Created ${createdCount} default users.`);
    } else {
      console.log('All default users already exist in the database. No seeding needed.');
    }
  } catch (error) {
    console.error('Error during database check/seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
