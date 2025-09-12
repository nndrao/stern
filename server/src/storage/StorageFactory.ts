import { IConfigurationStorage } from './IConfigurationStorage';
import { SqliteStorage } from './SqliteStorage';
import { MongoDbStorage } from './MongoDbStorage';

/**
 * Factory class for creating appropriate storage implementation
 * based on environment configuration
 */
export class StorageFactory {
  /**
   * Creates storage instance based on environment
   * Development/Test -> SQLite
   * Production -> MongoDB
   * Can be overridden with DATABASE_TYPE environment variable
   */
  static createStorage(): IConfigurationStorage {
    const env = process.env.NODE_ENV || 'development';
    const override = process.env.DATABASE_TYPE;
    
    // Log storage selection for debugging
    console.log(`🌍 Environment: ${env}`);
    
    // Explicit override
    if (override === 'mongodb') {
      console.log('🗄️  Storage: MongoDB (explicit override)');
      return new MongoDbStorage();
    }
    
    if (override === 'sqlite') {
      console.log('🗄️  Storage: SQLite (explicit override)');
      return new SqliteStorage();
    }
    
    // Environment-based selection
    switch (env) {
      case 'development':
      case 'test':
        console.log('🗄️  Storage: SQLite (development)');
        return new SqliteStorage();
        
      case 'production':
        console.log('🗄️  Storage: MongoDB (production)');
        return new MongoDbStorage();
        
      default:
        console.log('🗄️  Storage: SQLite (default)');
        return new SqliteStorage();
    }
  }

  /**
   * Validates environment configuration for the selected storage type
   */
  static validateEnvironment(): void {
    const env = process.env.NODE_ENV;
    const override = process.env.DATABASE_TYPE;
    
    // Check if production environment has required MongoDB configuration
    if ((env === 'production' || override === 'mongodb') && !process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required for production environment or when DATABASE_TYPE=mongodb');
    }
    
    // Validate SQLite path if specified
    if ((env !== 'production' || override === 'sqlite') && process.env.SQLITE_DATABASE_PATH) {
      const path = process.env.SQLITE_DATABASE_PATH;
      if (!path.endsWith('.db')) {
        console.warn('⚠️  SQLite database path should end with .db extension');
      }
    }
    
    console.log('✅ Environment configuration validated');
  }

  /**
   * Creates and initializes storage with connection
   */
  static async createAndConnect(): Promise<IConfigurationStorage> {
    this.validateEnvironment();
    
    const storage = this.createStorage();
    
    try {
      await storage.connect();
      console.log('✅ Storage connected successfully');
      return storage;
    } catch (error) {
      console.error('❌ Failed to connect to storage:', error);
      throw error;
    }
  }
}