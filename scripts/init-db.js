const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function initializeDatabase() {
  console.log('🔄 Initializing database...');
  
  try {
    // First, try to generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Test database connection
    console.log('🔌 Testing database connection...');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    try {
      await prisma.user.findFirst();
      console.log('✅ Database schema already exists!');
      await prisma.$disconnect();
      return;
    } catch (error) {
      console.log('🗄️  Database schema missing, creating tables...');
    }
    
    await prisma.$disconnect();
    
    // Push schema to database
    console.log('🗄️  Pushing schema to database...');
    execSync('npx prisma db push --accept-data-loss --force-reset', { stdio: 'inherit' });
    
    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    // Try alternative approach with migrations
    try {
      console.log('🔄 Trying migration approach...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Database initialized with migrations!');
    } catch (migrationError) {
      console.error('❌ Migration also failed:', migrationError);
      
      // Last resort: try to create schema manually using SQL
      try {
        console.log('🔄 Trying manual schema creation with SQL...');
        const fs = require('fs');
        const path = require('path');
        const prisma = new PrismaClient();
        await prisma.$connect();
        
        // Read and execute the schema SQL file
        const sqlPath = path.join(__dirname, 'create-schema.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Split SQL into individual statements and execute
        const statements = sqlContent.split(';').filter(stmt => stmt.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            await prisma.$executeRawUnsafe(statement + ';');
          }
        }
        
        await prisma.$disconnect();
        console.log('✅ Database schema created manually!');
      } catch (finalError) {
        console.error('❌ All database initialization attempts failed:', finalError);
        console.error('Final error details:', finalError);
        process.exit(1);
      }
    }
  }
}

initializeDatabase();