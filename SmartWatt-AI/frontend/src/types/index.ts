// ============================================================
// SmartWatt AI - Type Definitions
// ============================================================

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Home {
  id: number;
  user_id: number;
  home_name: string;
  electricity_tariff: number;
  created_at?: string;
}

export interface Appliance {
  id: number;
  home_id: number;
  appliance_name: string;
  rated_power: number;
  status: boolean;
  created_at?: string;
}

export interface EnergyReading {
  id: number;
  appliance_id: number;
  power_watts: number;
  energy_kwh: number;
  timestamp: string;
  simulated: boolean;
}

export interface DashboardSummary {
  today_consumption_kwh: number;
  monthly_consumption_kwh: number;
  predicted_consumption_kwh: number;
  estimated_bill: number;
  efficiency_score: number;
  active_appliances: number;
  total_appliances: number;
  simulation_running: boolean;
}

export interface ConsumptionData {
  labels: string[];
  values: number[];
  period: string;
}

export interface ApplianceConsumption {
  appliance_name: string;
  consumption_kwh: number;
  percentage: number;
  power_watts: number;
}

export interface PredictionResponse {
  date: string;
  predicted_kwh: number;
  confidence_lower?: number;
  confidence_upper?: number;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2_score: number;
  training_samples: number;
  test_samples: number;
  model_name: string;
  trained_at?: string;
}

export interface AnomalyResponse {
  id: number;
  appliance_id?: number;
  appliance_name?: string;
  anomaly_score: number;
  description: string;
  severity: string;
  detected_at?: string;
}

export interface RecommendationResponse {
  id: number;
  title: string;
  description: string;
  potential_savings_kwh?: number;
  potential_savings_cost?: number;
  priority: string;
  category?: string;
  created_at?: string;
}

export interface SimulationStatus {
  running: boolean;
  speed: number;
  readings_count: number;
  started_at?: string;
}
