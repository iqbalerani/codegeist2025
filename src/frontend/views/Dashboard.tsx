/**
 * Dashboard View
 * Main F1-style telemetry dashboard with real-time data
 */

import React from 'react';
import { rovo } from '@forge/bridge';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardGrid } from '../components/layout/DashboardGrid';
import { GaugeCard } from '../components/layout/GaugeCard';
import { Speedometer } from '../components/gauges/Speedometer';
import { TimeZoneGauge } from '../components/gauges/TimeZoneGauge';
import { ProgressRing } from '../components/gauges/ProgressRing';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';
import { RACING_FLAGS, LOAD_EMOJIS } from '../lib/constants';

export const Dashboard: React.FC = () => {
  const { data, loading, error } = useDashboardData();

  // Open Rovo chat
  const openRovoChat = async (prompt?: string) => {
    try {
      await rovo.open({
        type: 'forge',
        agentKey: 'driver-telemetry-agent',
        agentName: 'Driver Telemetry',
        prompt,
      });
    } catch (err) {
      console.error('Error opening Rovo:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Spinner size="large" />
          <div className="text-f1-text-secondary">Loading telemetry data...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card>
          <div className="text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-bold text-f1-text-primary">
              Unable to Load Telemetry
            </h2>
            <p className="text-f1-text-secondary">
              {error?.message || 'Complete more tickets to enable analysis or check Rovo chat.'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const {
    activeTickets,
    currentTimeZone,
    loadStatus,
    sprintProgress,
    todayRecommendations,
    timestamp,
    timingData,
    loadData,
  } = data;

  // Get zone badge variant
  const getZoneVariant = (): 'green' | 'yellow' | 'red' => {
    return currentTimeZone === 'peak' ? 'green' :
           currentTimeZone === 'danger' ? 'red' : 'yellow';
  };

  // Get load badge variant
  const getLoadVariant = (): 'green' | 'yellow' | 'red' => {
    return loadStatus === 'optimal' ? 'green' :
           loadStatus === 'critical' || loadStatus === 'over' ? 'red' : 'yellow';
  };

  return (
    <div className="min-h-screen p-6 bg-f1-background-dark">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card animate={false}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-racing text-gradient-racing racing-glow mb-2">
                🏎️ Driver Telemetry
              </h1>
              <p className="text-f1-text-secondary text-sm">
                F1-Style Performance Intelligence • Real-time Analytics
              </p>
            </div>
            <div className="text-right">
              <Badge variant={getZoneVariant()}>
                {RACING_FLAGS[currentTimeZone === 'peak' ? 'green' : currentTimeZone === 'danger' ? 'red' : 'yellow']} {currentTimeZone.toUpperCase()}
              </Badge>
              <div className="text-xs text-f1-text-muted mt-1">
                Updated: {new Date(timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </Card>

        {/* Gauge Cluster */}
        <DashboardGrid>
          {/* Track Conditions */}
          <GaugeCard
            title="Track Conditions"
            subtitle="When you perform best"
            icon="🏁"
          >
            {timingData ? (
              <TimeZoneGauge
                currentHour={timingData.currentHour}
                peakStart={timingData.peakWindow.start}
                peakEnd={timingData.peakWindow.end}
                dangerStart={timingData.dangerZone?.start}
                dangerEnd={timingData.dangerZone?.end}
              />
            ) : (
              <div className="text-center text-f1-text-muted py-8">
                Complete more tickets to enable timing analysis
              </div>
            )}
          </GaugeCard>

          {/* Workload Capacity */}
          <GaugeCard
            title="Workload Capacity"
            subtitle="Current vs optimal load"
            icon="⛽"
          >
            {loadData ? (
              <div className="space-y-4">
                <Speedometer
                  value={activeTickets}
                  maxValue={loadData.optimalMax * 2}
                  optimalMin={loadData.optimalMin}
                  optimalMax={loadData.optimalMax}
                  label="Active Tickets"
                />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-f1-text-secondary">Current Load:</span>
                    <Badge variant={getLoadVariant()}>
                      {LOAD_EMOJIS[loadStatus]} {loadStatus.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-f1-text-secondary text-center">
                    Optimal: {loadData.optimalMin}-{loadData.optimalMax} concurrent tickets
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-f1-text-muted py-8">
                Complete more tickets to enable load analysis
              </div>
            )}
          </GaugeCard>

          {/* Sprint Progress */}
          {sprintProgress && sprintProgress.percentComplete > 0 && (
            <GaugeCard
              title="Sprint Progress"
              subtitle="Current sprint completion"
              icon="🏁"
            >
              <div className="flex justify-center py-4">
                <div className="relative w-32 h-32">
                  <ProgressRing percentage={sprintProgress.percentComplete} size={120} />
                </div>
              </div>
              <div className="text-center text-sm text-f1-text-secondary">
                {sprintProgress.completed} completed • {sprintProgress.remaining} remaining
              </div>
            </GaugeCard>
          )}
        </DashboardGrid>

        {/* Recommendations */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 className="text-lg font-bold text-f1-text-primary">Recommendations</h3>
                <p className="text-sm text-f1-text-secondary">Personalized advice based on your patterns</p>
              </div>
            </div>
            {todayRecommendations && todayRecommendations.length > 0 ? (
              <div className="space-y-2">
                {todayRecommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-f1-text-secondary pl-4 border-l-2 border-f1-ferrari/30"
                  >
                    {rec}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-f1-text-muted">
                No recommendations available - complete more tickets to enable analysis
              </div>
            )}
          </div>
        </Card>

        {/* Team Radio (Rovo Chat) */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📡</span>
              <div>
                <h3 className="text-lg font-bold text-f1-text-primary">Team Radio</h3>
                <p className="text-sm text-f1-text-secondary">Ask your pit crew for personalized guidance</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => openRovoChat()}>
                Open Team Radio
              </Button>
              <Button variant="secondary" onClick={() => openRovoChat('When do I do my best work?')}>
                🕐 Best work time?
              </Button>
              <Button variant="secondary" onClick={() => openRovoChat('What should I work on next?')}>
                🎯 What's next?
              </Button>
              <Button variant="secondary" onClick={() => openRovoChat('Am I taking on too much?')}>
                ⚠️ Too much work?
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
