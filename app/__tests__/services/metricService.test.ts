
import { fetchMetricById } from '../../services/metricService';
import { Metric } from '../../types/metrics';

// Mock global fetch
global.fetch = jest.fn();

describe('Metric Service - Composite Metrics', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should calculate Govt Debt-to-Revenue correctly', async () => {
    // Mock responses for dependencies
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('GFDEBTN')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { date: '2020-01-01', value: 25000000 }, // 25 Trillion (Millions)
            ]
          })
        });
      }
      if (url.includes('FGRECPT')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { date: '2020-01-01', value: 4000 }, // 4 Trillion (Billions)
            ]
          })
        });
      }
      return Promise.resolve({ ok: false });
    });

    const metric = await fetchMetricById('govtDebtToRevenue');
    
    expect(metric).not.toBeNull();
    if (metric) {
      expect(metric.id).toBe('govtDebtToRevenue');
      expect(metric.data).toHaveLength(1);
      
      // Calculation: (25,000,000 / 1000) / 4000 = 25,000 / 4,000 = 6.25
      expect(metric.data[0].value).toBe(6.25);
      expect(metric.source).toBe('Calculated from FRED Data');
    }
  });

  it('should calculate Debt Service-to-Revenue correctly', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('A091RC1Q027SBEA')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { date: '2020-01-01', value: 500 }, // 500 Billion Interest
            ]
          })
        });
      }
      if (url.includes('FGRECPT')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { date: '2020-01-01', value: 4000 }, // 4000 Billion Revenue
            ]
          })
        });
      }
      return Promise.resolve({ ok: false });
    });

    const metric = await fetchMetricById('govtDebtServiceToRevenue');
    
    expect(metric).not.toBeNull();
    if (metric) {
      expect(metric.data).toHaveLength(1);
      // Calculation: (500 / 4000) * 100 = 12.5%
      expect(metric.data[0].value).toBe(12.5);
    }
  });

  it('should calculate Interest Rate vs Growth Spread correctly', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('GS10')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { date: '2020-01-01', value: 4.5 }, // 4.5% Rate
            ]
          })
        });
      }
      if (url.includes('A191RP1Q027SBEA')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { date: '2020-01-01', value: 3.5 }, // 3.5% Growth
            ]
          })
        });
      }
      return Promise.resolve({ ok: false });
    });

    const metric = await fetchMetricById('rateVsGrowth');
    
    expect(metric).not.toBeNull();
    if (metric) {
      expect(metric.data).toHaveLength(1);
      // Calculation: 4.5 - 3.5 = 1.0
      expect(metric.data[0].value).toBe(1.0);
    }
  });
});
