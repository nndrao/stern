/**
 * Mock Data Provider
 *
 * Simulates real-time data updates for testing without external dependencies
 * Generates random position/trade data with realistic updates
 */

import {
  BaseDataProvider,
  ConnectionConfig,
  SubscriptionOptions,
  DataProviderStatus
} from './IDataProvider';
import { logger } from '@/utils/logger';

interface MockPosition {
  id: string;
  symbol: string;
  quantity: number;
  price: number;
  value: number;
  side: 'BUY' | 'SELL';
  lastUpdated: string;
}

export class MockDataProvider extends BaseDataProvider {
  private updateInterval?: NodeJS.Timeout;
  private mockData: Map<string, MockPosition[]> = new Map();

  async connect(config: ConnectionConfig): Promise<void> {
    logger.info('MockDataProvider connecting', { url: config.url }, 'MockDataProvider');

    this.setStatus('connecting');

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate initial mock data
    this.generateMockData();

    // Start update interval
    this.startUpdates();

    this.setStatus('connected');

    logger.info('MockDataProvider connected', {}, 'MockDataProvider');
  }

  async disconnect(): Promise<void> {
    logger.info('MockDataProvider disconnecting', {}, 'MockDataProvider');

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }

    this.subscriptions.clear();
    this.mockData.clear();

    this.setStatus('disconnected');

    logger.info('MockDataProvider disconnected', {}, 'MockDataProvider');
  }

  subscribe(options: SubscriptionOptions): string {
    const subscriptionId = this.generateSubscriptionId();

    logger.info('MockDataProvider subscribing', {
      subscriptionId,
      topic: options.topic
    }, 'MockDataProvider');

    this.subscriptions.set(subscriptionId, options);

    // Send initial data immediately
    setTimeout(() => {
      const data = this.mockData.get(options.topic) || [];
      options.onData(data);
    }, 100);

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    logger.info('MockDataProvider unsubscribing', { subscriptionId }, 'MockDataProvider');

    this.subscriptions.delete(subscriptionId);
  }

  async send(topic: string, message: any): Promise<void> {
    logger.debug('MockDataProvider send (no-op)', { topic, message }, 'MockDataProvider');
    // Mock provider doesn't support sending
  }

  private generateMockData(): void {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'BAC', 'GS'];
    const sides: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];

    // Generate positions
    const positions: MockPosition[] = symbols.map((symbol, index) => {
      const quantity = Math.floor(Math.random() * 10000) + 100;
      const price = Math.random() * 1000 + 50;
      const side = sides[Math.floor(Math.random() * sides.length)];

      return {
        id: `pos-${index + 1}`,
        symbol,
        quantity,
        price: Number(price.toFixed(2)),
        value: Number((quantity * price).toFixed(2)),
        side,
        lastUpdated: new Date().toISOString()
      };
    });

    this.mockData.set('positions', positions);
    this.mockData.set('trades', this.generateTrades());

    logger.debug('Mock data generated', {
      positionCount: positions.length,
      tradeCount: this.mockData.get('trades')?.length
    }, 'MockDataProvider');
  }

  private generateTrades(): MockPosition[] {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
    const sides: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];

    return Array.from({ length: 20 }, (_, index) => {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const quantity = Math.floor(Math.random() * 1000) + 10;
      const price = Math.random() * 1000 + 50;
      const side = sides[Math.floor(Math.random() * sides.length)];

      return {
        id: `trade-${index + 1}`,
        symbol,
        quantity,
        price: Number(price.toFixed(2)),
        value: Number((quantity * price).toFixed(2)),
        side,
        lastUpdated: new Date().toISOString()
      };
    });
  }

  private startUpdates(): void {
    // Update data every 2 seconds
    this.updateInterval = setInterval(() => {
      this.updateMockData();
      this.broadcastUpdates();
    }, 2000);
  }

  private updateMockData(): void {
    // Update positions with random price changes
    const positions = this.mockData.get('positions') || [];

    positions.forEach(position => {
      // Random price movement +/- 5%
      const priceChange = (Math.random() - 0.5) * 0.1 * position.price;
      position.price = Number((position.price + priceChange).toFixed(2));
      position.value = Number((position.quantity * position.price).toFixed(2));
      position.lastUpdated = new Date().toISOString();
    });

    // Occasionally add a new trade
    if (Math.random() > 0.7) {
      const trades = this.mockData.get('trades') || [];
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
      const sides: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];

      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const quantity = Math.floor(Math.random() * 1000) + 10;
      const price = Math.random() * 1000 + 50;
      const side = sides[Math.floor(Math.random() * sides.length)];

      const newTrade: MockPosition = {
        id: `trade-${Date.now()}`,
        symbol,
        quantity,
        price: Number(price.toFixed(2)),
        value: Number((quantity * price).toFixed(2)),
        side,
        lastUpdated: new Date().toISOString()
      };

      trades.unshift(newTrade);

      // Keep only last 50 trades
      if (trades.length > 50) {
        trades.pop();
      }
    }
  }

  private broadcastUpdates(): void {
    this.subscriptions.forEach((options, subscriptionId) => {
      const data = this.mockData.get(options.topic);

      if (data) {
        try {
          // Apply filters if any
          let filteredData = data;

          if (options.filters) {
            filteredData = data.filter(item => {
              return Object.entries(options.filters!).every(([key, value]) => {
                return item[key as keyof MockPosition] === value;
              });
            });
          }

          options.onData(filteredData);
          this.incrementMessageCount();

          logger.debug('Broadcast update', {
            subscriptionId,
            topic: options.topic,
            itemCount: filteredData.length
          }, 'MockDataProvider');
        } catch (error) {
          this.incrementErrorCount();

          if (options.onError) {
            options.onError(error as Error);
          }

          logger.error('Broadcast error', error, 'MockDataProvider');
        }
      }
    });
  }
}

// Export singleton instance
export const mockDataProvider = new MockDataProvider();
