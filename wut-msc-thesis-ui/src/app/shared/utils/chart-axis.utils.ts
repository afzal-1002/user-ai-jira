/**
 * Utility functions for Chart.js Y-axis configuration
 * Provides dynamic, professional-grade axis scaling based on data values
 */

export interface YAxisConfig {
  max: number;
  stepSize: number;
}

/**
 * Calculate optimal Y-axis maximum and step size based on data values
 * 
 * Algorithm:
 * 1. Find max data value
 * 2. Determine which "bucket" it falls into (0-10, 0-20, 0-50, 0-100, etc.)
 * 3. Round step size to nice value (1, 2, 5, 10, 20, 50, 100, etc.)
 * 4. Set Y-axis max to ONE STEP BEYOND where data ends
 * 5. ALL grid lines are visible at each step
 * 
 * Examples:
 * - Max: 39.556 → stepSize: 5 → axisMax: 45 (ticks: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45)
 * - Max: 100 → stepSize: 20 → axisMax: 120 (ticks: 0, 20, 40, 60, 80, 100, 120)
 * - Max: 7.56 → stepSize: 2 → axisMax: 10 (ticks: 0, 2, 4, 6, 8, 10)
 * - Max: 1.5 → stepSize: 0.5 → axisMax: 2 (ticks: 0, 0.5, 1, 1.5, 2)
 * 
 * @param maxValue - The maximum value in the dataset
 * @returns Object with { max, stepSize } for chart configuration with visible grid lines
 */
export function calculateYAxis(maxValue: number): YAxisConfig {
  if (maxValue <= 0) {
    return { max: 1, stepSize: 1 };
  }

  // All possible nice step sizes we can use
  const niceSteps = [
    0.01, 0.02, 0.05, 0.1, 0.2, 0.5,
    1, 2, 5, 10, 20, 50,
    100, 200, 500, 1000, 2000, 5000,
    10000, 20000, 50000, 100000
  ];

  // Target 8 ticks for maximum granularity while maintaining readability
  // This allows for finer step sizes like 5 instead of jumping to 10
  const targetTickCount = 8;
  const roughStep = maxValue / targetTickCount;

  // Find the first nice step that's >= roughStep
  // This ensures we don't have TOO many ticks
  let stepSize = niceSteps[niceSteps.length - 1];
  for (const nice of niceSteps) {
    if (nice >= roughStep) {
      stepSize = nice;
      break;
    }
  }

  // Find which bucket the max value falls into
  const bucket = Math.ceil(maxValue / stepSize);

  // ALWAYS extend one step beyond the max data value
  // This ensures visual separation and professional appearance
  // Example: if max is 100 with step 20, axis goes to 120 (not 100)
  // This gives room for all grid lines and prevents crowding
  const axisMax = (bucket + 1) * stepSize;

  return {
    max: axisMax,
    stepSize: stepSize
  };
}

/**
 * Extract numeric values from chart data, handling various data formats
 * 
 * @param data - Chart data (can be array of numbers, objects with 'value' property, etc.)
 * @returns Array of numeric values
 */
export function extractNumericValues(data: any[]): number[] {
  if (!data || !Array.isArray(data)) {
    return [0];
  }

  return data
    .map(item => {
      if (typeof item === 'number') {
        return item;
      }
      if (typeof item === 'object' && item !== null) {
        // Handle various object formats
        return item.value || item.y || item.data || 0;
      }
      return 0;
    })
    .filter(val => Number.isFinite(val));
}

/**
 * Get Y-axis configuration from chart datasets
 * Extracts max value and calculates optimal axis settings
 * 
 * @param datasets - Chart.js datasets array
 * @returns YAxisConfig with calculated max and stepSize
 */
export function getYAxisFromDatasets(datasets: any[]): YAxisConfig {
  if (!datasets || datasets.length === 0) {
    return { max: 10, stepSize: 2 };
  }

  const allValues: number[] = [];

  datasets.forEach(dataset => {
    if (dataset.data && Array.isArray(dataset.data)) {
      const values = extractNumericValues(dataset.data);
      allValues.push(...values);
    }
  });

  if (allValues.length === 0) {
    return { max: 10, stepSize: 2 };
  }

  const maxValue = Math.max(...allValues);
  return calculateYAxis(maxValue);
}

