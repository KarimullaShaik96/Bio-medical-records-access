export interface MedicalRecord {
  id: string;
  date: string;
  doctorName: string;
  hospital: string;
  diagnosis: string;
  symptoms: string[];
  treatment: string;
  notes: string;
  category: string;
}

export interface HealthInsight {
  insight: string;
  evidence: string[];
}

export interface DrugInteraction {
  drugs: string[];
  interaction: string;
  sourceRecords: string[];
}

export interface AIAnalysisResult {
  healthInsights: HealthInsight[];
  drugInteractions: DrugInteraction[];
  uniqueMedications: string[];
}
