import { Metric, FredDataPoint } from '../types/metrics';

// Sample metrics definitions - we'll keep these for structure, but populate data dynamically
const METRIC_DEFINITIONS: Metric[] = [
  {
    id: 'gdp',
    title: 'Real GDP',
    description: 'Gross Domestic Product adjusted for inflation, measuring the total value of goods and services produced.',
    unit: ' Trillion $',
    category: 'economic',
    frequency: 'quarterly',
    data: [], // Will be populated from FRED API
    source: 'Federal Reserve Economic Data (FRED)',
    trendStatus: 'positive',
    trendDescription: 'GDP growth is fundamental to understanding the debt cycle. During the expansion phase, GDP grows steadily, while during contractions, growth slows or becomes negative.'
  },
  {
    id: 'unemployment',
    title: 'Unemployment Rate',
    description: 'Percentage of the labor force that is jobless and actively seeking employment.',
    unit: '%',
    category: 'economic',
    frequency: 'monthly',
    data: [], // Will be populated from FRED API
    source: 'Federal Reserve Economic Data (FRED)',
    isPercentage: true,
    trendStatus: 'positive',
    trendDescription: 'Unemployment typically falls during economic expansions and rises during contractions. Rapid increases often signal the deflationary phase of a debt cycle.'
  },
  {
    id: 'inflation',
    title: 'Consumer Price Index',
    description: 'Measures changes in the price level of a weighted average market basket of consumer goods and services.',
    unit: '',
    category: 'monetary',
    frequency: 'monthly',
    data: [], // Will be populated from FRED API
    source: 'Federal Reserve Economic Data (FRED)',
    trendStatus: 'warning',
    trendDescription: 'Inflation is a key indicator in debt cycles. High inflation can signal the inflationary phase, while deflation often accompanies deflationary debt crises.'
  },
  {
    id: 'federalFunds',
    title: 'Federal Funds Rate',
    description: 'The interest rate at which banks lend reserve balances to other banks overnight.',
    unit: '%',
    category: 'monetary',
    frequency: 'daily',
    data: [], // Will be populated from FRED API
    source: 'Federal Reserve Economic Data (FRED)',
    isPercentage: true,
    trendStatus: 'neutral',
    trendDescription: 'The Federal Funds Rate is the primary tool central banks use to respond to debt cycles. Rates are lowered during deflationary phases and raised during inflationary ones.'
  },
  {
    id: 'debtToGDP',
    title: 'Federal Debt to GDP',
    description: 'Total federal government debt as a percentage of Gross Domestic Product.',
    unit: '%',
    category: 'debt',
    frequency: 'quarterly',
    data: [], // Will be populated from FRED API
    source: 'Federal Reserve Economic Data (FRED)',
    isPercentage: true,
    trendStatus: 'negative',
    trendDescription: 'The debt-to-GDP ratio is central to debt cycle theory. High and rising ratios can indicate vulnerability to debt crises.'
  },
  {
    id: 'yieldCurve',
    title: 'Treasury Yield Curve',
    description: 'The difference between 10-year and 2-year Treasury bond yields.',
    unit: '%',
    category: 'financial',
    frequency: 'daily',
    data: [], // Will be populated from FRED API
    source: 'Federal Reserve Economic Data (FRED)',
    isPercentage: true,
    trendStatus: 'warning',
    trendDescription: 'An inverted yield curve (negative values) has historically been a reliable predictor of economic recessions and deflationary phases of debt cycles.'
  },
  {
    id: 'housingIndex',
    title: 'Housing Price Index',
    description: 'Measures changes in single-family home prices across the United States.',
    unit: '',
    category: 'financial',
    frequency: 'monthly',
    data: [], // Will be populated from FRED API
    source: 'Federal Reserve Economic Data (FRED)',
    trendStatus: 'neutral',
    trendDescription: 'Housing prices often rise during the expansion phase of a debt cycle and fall during the deleveraging phase, especially in deflationary debt crises.'
  },
  {
    id: 'consumerSentiment',
    title: 'Consumer Sentiment',
    description: 'Index measuring consumer confidence regarding the economy and personal finances.',
    unit: '',
    category: 'consumer',
    frequency: 'monthly',
    data: [], // Will be populated from FRED API
    source: 'Federal Reserve Economic Data (FRED)',
    trendStatus: 'neutral',
    trendDescription: 'Consumer sentiment typically rises during economic expansions and falls during contractions, reflecting psychological aspects of debt cycles.'
  },
  {
    id: 'govtDebtToRevenue',
    title: 'Govt Debt-to-Revenue',
    description: 'The ratio of total public debt to federal government current receipts. A more direct measure of debt burden than Debt-to-GDP.',
    unit: ' Ratio',
    category: 'debt-mechanics',
    frequency: 'quarterly',
    data: [], 
    source: 'FRED (Calculated)',
    trendStatus: 'negative',
    trendDescription: 'Rising debt-to-revenue indicates the government is accumulating obligations faster than its income, a precursor to debt crises.'
  },
  {
    id: 'govtDebtServiceToRevenue',
    title: 'Debt Service-to-Revenue',
    description: 'Interest payments as a percentage of federal receipts. Indicates the portion of income consumed by past debts.',
    unit: '%',
    category: 'debt-mechanics',
    frequency: 'quarterly',
    data: [], 
    source: 'FRED (Calculated)',
    isPercentage: true,
    trendStatus: 'negative',
    trendDescription: 'When debt service consumes a large portion of revenue, it crowds out other spending and forces more borrowing, creating a vicious cycle.'
  },
  {
    id: 'rateVsGrowth',
    title: 'Interest Rate vs Growth',
    description: 'The spread between the 10-Year Treasury Rate and Nominal GDP Growth. Positive values indicate tight monetary conditions relative to growth.',
    unit: '%',
    category: 'debt-mechanics',
    frequency: 'quarterly',
    data: [], 
    source: 'FRED (Calculated)',
    isPercentage: true,
    trendStatus: 'warning',
    trendDescription: 'If interest rates exceed income growth, debt burdens naturally compound. Keeping rates below growth is key to deleveraging.'
  },
  {
    id: 'debtToReserves',
    title: 'Debt-to-Reserves',
    description: 'Total public debt relative to total reserves. High values indicate a lack of a liquidity buffer.',
    unit: ' Ratio',
    category: 'debt-mechanics',
    frequency: 'quarterly',
    data: [], 
    source: 'FRED (Calculated)',
    trendStatus: 'negative',
    trendDescription: 'Low reserves relative to debt leave a country vulnerable to capital flight and currency crises.'
  }
];

// Configuration for composite metrics (calculated from multiple series)
const COMPOSITE_METRIC_CONFIG: Record<string, {
  formula: (values: Record<string, number>) => number;
  dependencies: string[];
}> = {
  'govtDebtToRevenue': {
    // Debt (Millions) / (Receipts (Billions) * 1000) -> Ratio
    // Note: Receipts are usually annual rate, if quarterly data is at annual rate (SAAR), we use as is.
    // FRED FGRECPT is Billions of Dollars, Seasonally Adjusted Annual Rate.
    // GFDEBTN is Millions of Dollars, Not Seasonally Adjusted.
    // We need to convert Debt to Billions: Debt / 1000.
    // Ratio = (Debt/1000) / Receipts.
    formula: (v) => (v['GFDEBTN'] / 1000) / v['FGRECPT'],
    dependencies: ['GFDEBTN', 'FGRECPT']
  },
  'govtDebtServiceToRevenue': {
    // Interest (Billions) / Receipts (Billions) * 100
    formula: (v) => (v['A091RC1Q027SBEA'] / v['FGRECPT']) * 100,
    dependencies: ['A091RC1Q027SBEA', 'FGRECPT']
  },
  'rateVsGrowth': {
    // 10Y Rate - Nominal GDP Growth
    // We need to calculate GDP Growth first.
    // For simplicity here, let's assume we can fetch the growth rate directly if available, 
    // OR we calculate growth from GDP levels on the fly.
    // Since we only fetch single points here, calculating growth (which needs history) is hard in this simple map.
    // However, we can fetch 'A191RL1Q225SBEA' (Real Growth) and add Inflation? 
    // Dalio says "Nominal income growth rates". 
    // Let's use Nominal GDP (GDP) and calculate growth in the data processing step?
    // OR better: Just fetch the Nominal GDP Growth series if it exists?
    // 'A191RP1Q027SBEA' is "Gross Domestic Product, Percent Change from Preceding Period" (Nominal).
    // Let's check if 'A191RP1Q027SBEA' is available. If not, I'll stick to the plan of calculating it.
    // But wait, the config takes `values` for a single point in time. I can't calculate growth (requires T-1) here easily.
    // SOLUTION: Use the Nominal GDP Growth Series from FRED directly! 
    // Series: A191RP1Q027SBEA
    // Formula: GS10 - NominalGDPGrowth
    formula: (v) => v['GS10'] - v['A191RP1Q027SBEA'],
    dependencies: ['GS10', 'A191RP1Q027SBEA']
  },
  'debtToReserves': {
    // Debt (Millions) / (Reserves (Millions) * 1000?? No, Reserves are Millions $)
    // TOTRESNS is Millions of Dollars.
    // GFDEBTN is Millions of Dollars.
    // Ratio = Debt / Reserves
    formula: (v) => v['GFDEBTN'] / v['TOTRESNS'],
    dependencies: ['GFDEBTN', 'TOTRESNS']
  }
};

// Map our internal metric IDs to FRED series IDs
const METRIC_TO_FRED_MAP: Record<string, string> = {
  'gdp': 'A191RL1Q225SBEA', // Real GDP Growth Rate
  'unemployment': 'UNRATE', // Unemployment Rate
  'inflation': 'CPIAUCSL', // Consumer Price Index
  'federalFunds': 'DFF', // Federal Funds Rate
  'debtToGDP': 'GFDEGDQ188S', // Federal Debt to GDP
  'yieldCurve': 'T10Y2Y', // Treasury Yield Curve
  'housingIndex': 'CSUSHPINSA', // Housing Price Index
  'consumerSentiment': 'UMCSENT', // Consumer Sentiment
};

/**
 * Generate example data for a metric when real data can't be loaded
 */
function generateExampleData(metric: Metric): FredDataPoint[] {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 10; // 10 years of data
  const data: FredDataPoint[] = [];
  
  // Generate different patterns based on the metric
  let minValue = 0;
  let maxValue = 100;
  let pattern: 'up' | 'down' | 'cycle' | 'random' = 'random';
  
  switch (metric.id) {
    case 'gdp':
      minValue = 17; // Trillion dollars
      maxValue = 25;
      pattern = 'up';
      break;
    case 'unemployment':
      minValue = 3; // Percentage
      maxValue = 15;
      pattern = 'cycle';
      break;
    case 'inflation':
      minValue = 0;
      maxValue = 9;
      pattern = 'cycle';
      break;
    case 'federalFunds':
      minValue = 0;
      maxValue = 5;
      pattern = 'cycle';
      break;
    case 'debtToGDP':
      minValue = 60;
      maxValue = 130;
      pattern = 'up';
      break;
    case 'yieldCurve':
      minValue = -2;
      maxValue = 3;
      pattern = 'cycle';
      break;
    case 'housingIndex':
      minValue = 100;
      maxValue = 250;
      pattern = 'up';
      break;
    case 'consumerSentiment':
      minValue = 50;
      maxValue = 110;
      pattern = 'cycle';
      break;
    default:
      minValue = 0;
      maxValue = 100;
      pattern = 'random';
  }
  
  // Generate the data points
  for (let year = startYear; year <= currentYear; year++) {
    // Generate quarterly or monthly data depending on frequency
    const intervals = metric.frequency === 'quarterly' ? 4 : 12;
    
    for (let i = 0; i < intervals; i++) {
      const progress = (year - startYear + i / intervals) / (currentYear - startYear + 1);
      let value: number;
      
      switch (pattern) {
        case 'up':
          // Upward trend with some randomness
          value = minValue + (maxValue - minValue) * progress + Math.random() * 5 - 2.5;
          break;
        case 'cycle':
          // Cyclical pattern (sine wave)
          value = ((maxValue - minValue) / 2) + ((maxValue - minValue) / 2) * 
                Math.sin(progress * Math.PI * 4) + (Math.random() * 3 - 1.5);
          break;
        case 'random':
        default:
          // Random values within range
          value = minValue + Math.random() * (maxValue - minValue);
      }
      
      // Ensure value stays within bounds and round to 2 decimal places
      value = Math.max(minValue, Math.min(maxValue, value));
      value = Math.round(value * 100) / 100;
      
      // Format the date
      let date: string;
      if (metric.frequency === 'quarterly') {
        const quarter = i + 1;
        date = `${year}-${quarter.toString().padStart(2, '0')}-01`;
      } else {
        const month = i + 1;
        date = `${year}-${month.toString().padStart(2, '0')}-01`;
      }
      
      data.push({ date, value });
    }
  }
  
  return data;
}

/**
 * Helper to fetch data for a composite metric
 */
async function fetchCompositeMetricData(metricId: string): Promise<FredDataPoint[]> {
  const config = COMPOSITE_METRIC_CONFIG[metricId];
  if (!config) return [];

  try {
    // Fetch all dependencies in parallel
    const dependencyData = await Promise.all(
      config.dependencies.map(async (seriesId) => {
        const response = await fetch(`/api/fred/${seriesId}?metricId=${metricId}-dep`);
        if (!response.ok) return { seriesId, data: [] };
        const result = await response.json();
        return { seriesId, data: result.data as FredDataPoint[] };
      })
    );

    // Create a map of date -> { seriesId: value }
    const dateMap: Record<string, Record<string, number>> = {};
    
    dependencyData.forEach(({ seriesId, data }) => {
      data.forEach(point => {
        if (!dateMap[point.date]) dateMap[point.date] = {};
        dateMap[point.date][seriesId] = point.value;
      });
    });

    // Calculate formula for each date where we have all dependencies
    const results: FredDataPoint[] = [];
    
    Object.entries(dateMap).forEach(([date, values]) => {
      // Check if we have all dependencies
      const hasAllDeps = config.dependencies.every(dep => values[dep] !== undefined);
      
      if (hasAllDeps) {
        try {
          const calculatedValue = config.formula(values);
          // Round to 2 decimals
          results.push({
            date,
            value: Math.round(calculatedValue * 100) / 100
          });
        } catch (e) {
          // Ignore calculation errors
        }
      }
    });

    // Sort by date
    return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error(`Error calculating composite metric ${metricId}:`, error);
    return [];
  }
}

/**
 * Fetch a single metric data (either direct FRED mapping or composite)
 */
async function fetchMetricData(metric: Metric): Promise<Metric> {
  // Case 1: Composite Metric
  if (COMPOSITE_METRIC_CONFIG[metric.id]) {
    const data = await fetchCompositeMetricData(metric.id);
    if (data.length > 0) {
      return { ...metric, data, source: 'Calculated from FRED Data' };
    }
    // Fallback to example if calculation failed
    return { ...metric, data: generateExampleData(metric), source: 'Example Data (Calculation Failed)' };
  }

  // Case 2: Direct FRED Mapping
  const seriesId = METRIC_TO_FRED_MAP[metric.id];
  if (!seriesId) {
    // Fallback
    return { ...metric, data: generateExampleData(metric), source: 'Example Data (No FRED mapping)' };
  }

  try {
    const response = await fetch(`/api/fred/${seriesId}?metricId=${metric.id}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const result = await response.json();
    if (result.data && result.data.length > 0) {
      return {
        ...metric,
        data: result.data,
        source: `Federal Reserve Economic Data (FRED) - ${seriesId}`
      };
    }
  } catch (error) {
    console.error(`Error fetching data for ${metric.id}:`, error);
  }

  return { ...metric, data: generateExampleData(metric), source: 'Example Data (Error fetching)' };
}

/**
 * Fetch all available metrics with real data
 */
export async function fetchMetrics(): Promise<Metric[]> {
  try {
    const metrics = [...METRIC_DEFINITIONS];
    return await Promise.all(metrics.map(fetchMetricData));
  } catch (error) {
    console.error('Error in fetchMetrics:', error);
    return METRIC_DEFINITIONS.map(metric => ({
      ...metric,
      data: generateExampleData(metric),
      source: 'Example Data (Error)'
    }));
  }
}

/**
 * Fetch a single metric by ID
 */
export async function fetchMetricById(id: string): Promise<Metric | null> {
  try {
    const metricDefinition = METRIC_DEFINITIONS.find(m => m.id === id);
    if (!metricDefinition) return null;
    return await fetchMetricData(metricDefinition);
  } catch (error) {
    console.error(`Error fetching metric ${id}:`, error);
    const def = METRIC_DEFINITIONS.find(m => m.id === id);
    return def ? { ...def, data: generateExampleData(def), source: 'Example Data (Error)' } : null;
  }
}
