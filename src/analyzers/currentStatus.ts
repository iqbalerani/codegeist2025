/**
 * Current Status Analyzer
 * Real-time status check combining multiple intelligence modules
 */

import { CurrentStatus } from '../models/analysis';
import { getActiveIssues } from '../data/jira/issues';
import { getCached, setCache } from '../data/cache';
import { STATUS_TTL_HOURS } from '../models/cache';
import { getCurrentTimeZone } from '../utils/dateHelpers';
import { analyzeTimingPatterns } from './timing';
import { analyzeLoadPatterns } from './load';

/**
 * Get current status for a user
 * If accountId is undefined, uses currentUser() in JQL queries
 */
export async function getCurrentStatus(accountId?: string): Promise<CurrentStatus> {
  console.log('========================================');
  console.log('getCurrentStatus CALLED');
  console.log('Input accountId:', accountId);
  console.log('========================================');

  // Use a default ID for caching when accountId is not provided
  const cacheAccountId = accountId || 'currentUser';
  console.log('Cache accountId:', cacheAccountId);

  // TEMPORARILY DISABLED: Check cache with short TTL (15 minutes for real-time status)
  // This forces fresh data fetch to test if JQL query works correctly
  /*
  const cacheKey = { namespace: 'status' as const, accountId: cacheAccountId };
  const cached = await getCached<CurrentStatus>(cacheKey, STATUS_TTL_HOURS);

  if (cached) {
    console.log('CACHE HIT - Returning cached status');
    console.log('Cached data:', JSON.stringify(cached, null, 2));
    return cached;
  }
  */

  console.log('CACHE DISABLED - Always fetching fresh data for debugging');

  // Get active tickets
  console.log('Calling getActiveIssues with accountId:', accountId);
  const activeIssues = await getActiveIssues(accountId);
  console.log('Active issues returned:', activeIssues.length);
  console.log('Active issues details:', JSON.stringify(activeIssues.map(i => ({
    key: i.key,
    status: i.status,
    summary: i.summary
  })), null, 2));
  const activeTickets = activeIssues.length;

  // Get timing analysis
  let currentTimeZone: 'peak' | 'normal' | 'danger' = 'normal';
  let timingData: CurrentStatus['timingData'] | undefined;
  try {
    const timingAnalysis = await analyzeTimingPatterns(cacheAccountId);
    const currentHour = new Date().getHours();
    currentTimeZone = getCurrentTimeZone(
      currentHour,
      timingAnalysis.peakWindow.start,
      timingAnalysis.peakWindow.end,
      timingAnalysis.dangerZone?.start
    );

    // Store timing data for gauges
    timingData = {
      currentHour,
      peakWindow: {
        start: timingAnalysis.peakWindow.start,
        end: timingAnalysis.peakWindow.end
      },
      dangerZone: timingAnalysis.dangerZone ? {
        start: timingAnalysis.dangerZone.start,
        end: timingAnalysis.dangerZone.end
      } : undefined
    };
  } catch (error) {
    console.error('Error getting timing analysis:', error);
  }

  // Get load analysis
  let loadStatus: 'under' | 'optimal' | 'over' | 'critical' = 'optimal';
  let loadData: CurrentStatus['loadData'] | undefined;
  try {
    const loadAnalysis = await analyzeLoadPatterns(cacheAccountId);
    loadStatus = loadAnalysis.currentStatus;

    // Store load data for gauges
    loadData = {
      optimalMin: loadAnalysis.optimalRange.min,
      optimalMax: loadAnalysis.optimalRange.max,
      currentLoad: loadAnalysis.currentLoad
    };
  } catch (error) {
    console.error('Error getting load analysis:', error);
  }

  // Calculate sprint progress (simplified - would need sprint API integration)
  const sprintProgress = {
    completed: 0,
    remaining: activeTickets,
    percentComplete: 0,
    onTrack: true
  };

  // Generate today's recommendations
  const todayRecommendations = generateTodayRecommendations(
    currentTimeZone,
    loadStatus,
    activeTickets
  );

  const status: CurrentStatus = {
    accountId: cacheAccountId, // Use the cache key which is always a string
    activeTickets,
    currentTimeZone,
    loadStatus,
    sprintProgress,
    todayRecommendations,
    timestamp: new Date(),
    timingData,
    loadData
  };

  // TEMPORARILY DISABLED: Cache with short TTL
  // await setCache(cacheKey, status, STATUS_TTL_HOURS);

  console.log('Returning fresh status (no cache write)');
  return status;
}

/**
 * Generate categorized recommendations for today
 */
function generateTodayRecommendations(
  timeZone: 'peak' | 'normal' | 'danger',
  loadStatus: 'under' | 'optimal' | 'over' | 'critical',
  activeTickets: number
): string[] {
  const recommendations: string[] = [];

  // Time zone recommendations with better context
  switch (timeZone) {
    case 'peak':
      recommendations.push('⏰ TIMING: You\'re in your peak productivity window');
      recommendations.push('   → This is the best time for complex, critical work');
      recommendations.push('   → Your quality and speed are highest right now');
      break;
    case 'danger':
      recommendations.push('⏰ TIMING: You\'re in your danger zone');
      recommendations.push('   → Quality drops during this time - avoid critical tasks');
      recommendations.push('   → Consider light work, reviews, or taking a break');
      break;
    case 'normal':
      recommendations.push('⏰ TIMING: Normal productivity window');
      recommendations.push('   → Good time for regular tasks and steady progress');
      recommendations.push('   → Save complex work for your peak hours');
      break;
  }

  // Load recommendations with actionable advice
  switch (loadStatus) {
    case 'under':
      recommendations.push('📊 WORKLOAD: Below optimal capacity');
      recommendations.push('   → You have room to take on more work');
      recommendations.push('   → Consider picking up 1-2 more tickets from the backlog');
      break;
    case 'optimal':
      recommendations.push('📊 WORKLOAD: Optimal balance ⭐');
      recommendations.push('   → You\'re at your sweet spot for productivity');
      recommendations.push('   → Maintain this balance for best results');
      break;
    case 'over':
      recommendations.push('📊 WORKLOAD: Above optimal capacity ⚠️');
      recommendations.push('   → Focus on completing current work before adding more');
      recommendations.push('   → Quality may suffer with additional tasks');
      break;
    case 'critical':
      recommendations.push('📊 WORKLOAD: Critical overload 🔴');
      recommendations.push('   → Prioritize completing existing work immediately');
      recommendations.push('   → Avoid starting any new tasks until load decreases');
      break;
  }

  // Active tickets guidance with context
  if (activeTickets === 0) {
    recommendations.push('📋 NEXT STEPS: No active work');
    recommendations.push('   → Check your backlog and pick up the next priority task');
  } else if (activeTickets === 1) {
    recommendations.push('📋 FOCUS: Single task in progress');
    recommendations.push('   → Excellent focus - maintain momentum on this ticket');
  } else if (activeTickets <= 3) {
    recommendations.push(`📋 FOCUS: ${activeTickets} tasks in progress`);
    recommendations.push('   → Review priorities and focus on highest-value work');
  } else {
    recommendations.push(`📋 FOCUS: ${activeTickets} concurrent tasks`);
    recommendations.push('   → Consider which tasks can be completed quickly');
    recommendations.push('   → High context switching may impact efficiency');
  }

  return recommendations;
}
