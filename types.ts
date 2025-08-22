export enum Profitability {
  GOOD = 'GOOD',
  MEDIUM = 'MEDIUM',
  BAD = 'BAD',
  NONE = 'NONE'
}

export interface RideInput {
  fare: number;
  distanceOfTrip: number;
  estimatedTime: number; // in minutes
}

export interface RideAnalysis extends RideInput {
  id: string;
  totalTimeHours: number;
  netProfit: number;
  netEarningsPerKm: number;
  netEarningsPerHour: number;
  grossEarningsPerHour: number;
  profitability: Profitability;
}

export interface Settings {
  targetEarningsPerKm: number;
  gasPrice: number; // price per liter
  fuelConsumption: number; // km per liter
  otherVehicleCostsPerKm: number; // maintenance, tires, etc.
  currency: string;
}

export interface User {
  email: string;
  password: string;
  isPro: boolean;
}
