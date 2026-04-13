import type { Frequency, DailyActivityFrequency } from './types';

const frequencyScores: Record<Frequency, number> = {
  'no': 1,
  '1-2': 2,
  '3-4': 3,
  '5-6': 4,
  '7+': 5,
};

const dailyFrequencyScores: Record<DailyActivityFrequency, number> = {
  'Ninguna': 1,
  'Poca': 2,
  'Normal': 3,
  'Bastante': 4,
  'Mucha': 5,
};

// Generic score mapping for 'a' through 'e' options
const optionScores: Record<string, number> = {
  'a': 1,
  'b': 2,
  'c': 3,
  'd': 4,
  'e': 5,
};

export interface PaqCFormValues {
  // PAQ-C Question 1: Activity list
  paqC1_activities: Record<string, Frequency | null>; // e.g. { saltar_soga: '1-2', ... }
  paqC1_other_activity_text?: string; // Text for "Otros"

  // PAQ-C Questions 2-8 (multiple choice with a,b,c,d,e options)
  paqC2_educacion_fisica: string; // 'a' through 'e'
  paqC3_recreo: string;
  paqC4_antes_despues_comer: string;
  paqC5_despues_colegio: string;
  paqC6_noche: string;
  paqC7_fin_semana: string;
  paqC8_descripcion_semana: string;

  // PAQ-C Question 9: Daily activity frequency
  paqC9_daily_freq: Record<string, DailyActivityFrequency | null>; // e.g. { lunes: 'Poca', ... }

  // PAQ-C Question 10
  paqC10_enfermo: 'si' | 'no';
  paqC10_enfermo_razon?: string;
}

export interface PaqAFormValues {
 // PAQ-A Question 1: Activity list
  paqA1_activities: Record<string, Frequency | null>; 
  paqA1_other_activity_text?: string;

  // PAQ-A Questions 2-7 (multiple choice with a,b,c,d,e options)
  paqA2_educacion_fisica: string; 
  paqA3_hasta_almuerzo: string;
  paqA4_despues_colegio: string;
  paqA5_tardes: string;
  paqA6_fin_semana: string;
  paqA7_descripcion_semana: string;

  // PAQ-A Question 8: Daily activity frequency
  paqA8_daily_freq: Record<string, DailyActivityFrequency | null>; 

  // PAQ-A Question 9
  paqA9_enfermo: 'si' | 'no';
  paqA9_enfermo_razon?: string;
}


export function calculatePaqScore(values: PaqCFormValues | PaqAFormValues, type: 'PAQ-C' | 'PAQ-A'): { score: number; classification: string } {
  let totalScore = 0;
  let itemCount = 0;

  const activityData = type === 'PAQ-C' ? (values as PaqCFormValues).paqC1_activities : (values as PaqAFormValues).paqA1_activities;
  const dailyFreqData = type === 'PAQ-C' ? (values as PaqCFormValues).paqC9_daily_freq : (values as PaqAFormValues).paqA8_daily_freq;

  // 1. Score for activity list (Question 1 for PAQ-C, Question 1 for PAQ-A)
  let activityListScoreSum = 0;
  let activityListCount = 0;
  for (const key in activityData) {
    const frequency = activityData[key];
    if (frequency && key !== 'otros') { // Exclude "Otros" text field from direct scoring, but count if 'otros' radio selected
        activityListScoreSum += frequencyScores[frequency as Frequency] || 0;
        activityListCount++;
    } else if (key === 'otros' && frequency) { // If 'otros' radio option is selected
        activityListScoreSum += frequencyScores[frequency as Frequency] || 0;
        activityListCount++; // Count it as an activity
    }
  }
  if (activityListCount > 0) {
    totalScore += activityListScoreSum / activityListCount;
    itemCount++;
  }
  
  // 2. Score for multiple choice questions (Q2-Q8 for PAQ-C, Q2-Q7 for PAQ-A)
  const mcqKeys = type === 'PAQ-C' 
    ? ['paqC2_educacion_fisica', 'paqC3_recreo', 'paqC4_antes_despues_comer', 'paqC5_despues_colegio', 'paqC6_noche', 'paqC7_fin_semana', 'paqC8_descripcion_semana']
    : ['paqA2_educacion_fisica', 'paqA3_hasta_almuerzo', 'paqA4_despues_colegio', 'paqA5_tardes', 'paqA6_fin_semana', 'paqA7_descripcion_semana'];

  mcqKeys.forEach(key => {
    const value = (values as any)[key];
    if (value && optionScores[value]) {
      totalScore += optionScores[value];
      itemCount++;
    }
  });

  // 3. Score for daily activity frequency (Question 9 for PAQ-C, Question 8 for PAQ-A)
  let dailyFreqScoreSum = 0;
  let dailyFreqCount = 0;
  for (const day in dailyFreqData) {
    const freq = dailyFreqData[day];
    if (freq) {
      dailyFreqScoreSum += dailyFrequencyScores[freq as DailyActivityFrequency] || 0;
      dailyFreqCount++;
    }
  }
  if (dailyFreqCount > 0) {
    totalScore += dailyFreqScoreSum / dailyFreqCount;
    itemCount++;
  }

  const finalAverageScore = itemCount > 0 ? totalScore / itemCount : 0;

  let classification = "No clasificable";
  if (finalAverageScore >= 1.0 && finalAverageScore <= 2.33) {
    classification = "Actividad física baja";
  } else if (finalAverageScore >= 2.34 && finalAverageScore <= 3.66) {
    classification = "Actividad física moderada";
  } else if (finalAverageScore >= 3.67 && finalAverageScore <= 5.0) {
    classification = "Actividad física alta";
  }
  
  return { score: parseFloat(finalAverageScore.toFixed(2)), classification };
}

// Note: Question 10 (PAQ-C) / Question 9 (PAQ-A) about illness is not typically part of the PAQ score calculation itself
// but is important contextual information.
