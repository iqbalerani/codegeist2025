/**
 * Analysis Result Models
 * Output structures for each intelligence module
 */

import { DayPattern } from './metrics';

// Re-export DayPattern for use in analyzers
export { DayPattern };

export interface TimingAnalysis {
  accountId: string;
  peakWindow: {
    start: number; // hour (0-23)
    end: number;   // hour (0-23)
    qualityMultiplier: number;
    description: string;
  };
  dangerZone?: {
    start: number;
    end: number;
    revertMultiplier: number;
    description: string;
  };
  dayPatterns: Record<string, DayPattern>;
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  dataPoints: number;
  lastUpdated: Date;
}

export interface StrengthAnalysis {
  accountId: string;
  ticketTypes: Record<string, StrengthMetric>;
  components: Record<string, ComponentStrength>;
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  dataPoints: number;
  lastUpdated: Date;
}

export interface StrengthMetric {
  type: string;
  userAvg: number;
  teamAvg?: number;
  delta: number; // negative = strength, positive = weakness
  count: number;
  qualityScore: number;
}

export interface ComponentStrength {
  component: string;
  userAvg: number;
  teamAvg?: number;
  count: number;
  expertise: 'expert' | 'strong' | 'average' | 'developing' | 'avoid';
  qualityScore: number;
}

export interface CollaborationAnalysis {
  accountId: string;
  bestReviewers: ReviewerProfile[];
  reviewerStats: Record<string, ReviewerStats>;
  pairEffectiveness: Record<string, PairMetrics>;
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  dataPoints: number;
  lastUpdated: Date;
}

export interface ReviewerProfile {
  accountId: string;
  displayName: string;
  avgReviewTimeDays: number;
  approvalRate: number;
  changesRequestedRate: number;
  totalReviews: number;
  rating: 'excellent' | 'good' | 'average' | 'slow';
}

export interface ReviewerStats {
  accountId: string;
  displayName: string;
  totalReviews: number;
  avgReviewTimeHours: number;
  approvalRate: number;
  thoroughnessScore: number;
}

export interface PairMetrics {
  partnerAccountId: string;
  partnerName: string;
  speedMultiplier: number;
  qualityMultiplier: number;
  collaborationCount: number;
}

export interface LoadAnalysis {
  accountId: string;
  optimalRange: {
    min: number;
    max: number;
  };
  loadCurve: Record<number, LoadPoint>;
  currentLoad: number;
  currentStatus: 'under' | 'optimal' | 'over' | 'critical';
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  dataPoints: number;
  lastUpdated: Date;
}

export interface LoadPoint {
  load: number;
  cycleTime: number;
  defectRate: number;
  completionRate: number;
  score: number; // composite score
}

export interface TrendAnalysis {
  accountId: string;
  velocityTrend: TrendData[];
  qualityTrend: TrendData[];
  skillsEvolution: SkillEvolution[];
  periodComparison: {
    current: PeriodMetrics;
    previous: PeriodMetrics;
    delta: Record<string, number>;
  };
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  dataPoints: number;
  lastUpdated: Date;
}

export interface TrendData {
  period: string; // sprint name or month
  startDate: Date;
  endDate: Date;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SkillEvolution {
  skill: string; // technology, ticket type, or component
  currentLevel: number;
  previousLevel: number;
  growth: number;
  trend: 'growing' | 'declining' | 'stable';
}

export interface PeriodMetrics {
  period: string;
  issuesCompleted: number;
  storyPoints: number;
  avgCycleTime: number;
  qualityScore: number;
  defectRate: number;
}

export interface CurrentStatus {
  accountId: string;
  activeTickets: number;
  currentTimeZone: 'peak' | 'normal' | 'danger';
  loadStatus: 'under' | 'optimal' | 'over' | 'critical';
  sprintProgress: {
    completed: number;
    remaining: number;
    percentComplete: number;
    onTrack: boolean;
  };
  todayRecommendations: string[];
  timestamp: Date;
  // Enhanced timing data for gauges
  timingData?: {
    currentHour: number;
    peakWindow: {
      start: number;
      end: number;
    };
    dangerZone?: {
      start: number;
      end: number;
    };
  };
  // Enhanced load data for gauges
  loadData?: {
    optimalMin: number;
    optimalMax: number;
    currentLoad: number;
  };
}

export interface RecommendationContext {
  type: 'ticket_selection' | 'timing' | 'reviewer' | 'workload' | 'general';
  specificContext?: Record<string, any>;
}

export interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  reasoning: string;
  actionable: boolean;
  actions?: string[];
}
