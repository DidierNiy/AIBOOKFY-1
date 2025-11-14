import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config();

const checkEnvironmentVariables = () => {
  const requiredVars = [
    'PORT',
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_EXPIRE',
    'OPENAI_API_KEY',
    'FRONTEND_URL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    return false;
  }

  console.log('✅ All required environment variables are present');
  return true;
};

const testMongoConnection = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined');
    }

    console.log('📡 Testing MongoDB connection...');
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connection successful');
    
    // Test write operation
    const testCollection = mongoose.connection.collection('connection_test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('✅ MongoDB write operation successful');
    
    // Clean up test data
    await testCollection.deleteOne({ test: true });
    console.log('✅ MongoDB cleanup successful');

    await mongoose.disconnect();
    console.log('✅ MongoDB disconnection successful');
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    return false;
  }
};

const main = async () => {
  console.log('🔍 Starting environment verification...\n');

  const envCheck = checkEnvironmentVariables();
  if (!envCheck) {
    process.exit(1);
  }

  console.log('\n🔍 Starting MongoDB connection test...\n');

  const mongoCheck = await testMongoConnection();
  if (!mongoCheck) {
    process.exit(1);
  }

  console.log('\n✅ All checks passed successfully!');
  process.exit(0);
};

// Run the verification
main().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});