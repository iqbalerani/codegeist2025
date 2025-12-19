/**
 * IssuePanel View
 * Compact telemetry view for issue sidebar
 */

import React from 'react';
import { rovo } from '@forge/bridge';
import { useDashboardData } from '../hooks/useDashboardData';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { RACING_FLAGS, LOAD_EMOJIS } from '../lib/constants';

export const IssuePanel: React.FC = () => {
  const { data, loading, error } = useDashboardData();

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
      <div className="p-4 flex items-center justify-center">
        <Spinner size="small" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4">
        <Card>
          <p className="text-sm text-f1-text-secondary">
            Ask "Driver Telemetry" in Rovo chat for insights.
          </p>
        </Card>
      </div>
    );
  }

  const { activeTickets, currentTimeZone, loadStatus, todayRecommendations, timingData, loadData } = data;

  const getZoneVariant = (): 'green' | 'yellow' | 'red' => {
    return currentTimeZone === 'peak' ? 'green' :
           currentTimeZone === 'danger' ? 'red' : 'yellow';
  };

  const getLoadVariant = (): 'green' | 'yellow' | 'red' => {
    return loadStatus === 'optimal' ? 'green' :
           loadStatus === 'critical' || loadStatus === 'over' ? 'red' : 'yellow';
  };

  return (
    <div className="p-4 space-y-4 bg-f1-background-dark">
      {/* Header */}
      <Card>
        <h3 className="text-lg font-racing text-gradient-racing mb-2">
          🏎️ Telemetry
        </h3>
      </Card>

      {/* Quick Status */}
      <Card>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-bold text-f1-text-secondary mb-1">TRACK STATUS</div>
            <div className="flex items-center gap-2">
              <Badge variant={getZoneVariant()}>
                {RACING_FLAGS[currentTimeZone === 'peak' ? 'green' : currentTimeZone === 'danger' ? 'red' : 'yellow']} {currentTimeZone.toUpperCase()}
              </Badge>
              {timingData && (
                <span className="text-xs text-f1-text-muted">
                  Now: {timingData.currentHour}:00
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-f1-text-secondary mb-1">WORKLOAD</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-f1-text-primary">{activeTickets}</span>
                <span className="text-sm text-f1-text-secondary">tickets</span>
              </div>
              {loadData && (
                <div className="text-xs text-f1-text-muted">
                  Optimal: {loadData.optimalMin}-{loadData.optimalMax}
                </div>
              )}
              <Badge variant={getLoadVariant()}>
                {LOAD_EMOJIS[loadStatus]} {loadStatus.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Recommendation */}
      {todayRecommendations && todayRecommendations.length > 0 && (
        <Card>
          <div className="space-y-2">
            <div className="text-xs font-bold text-f1-text-secondary">💡 TOP RECOMMENDATION</div>
            <div className="text-sm text-f1-text-secondary">
              {todayRecommendations[0]}
            </div>
          </div>
        </Card>
      )}

      {/* Team Radio */}
      <Card>
        <div className="space-y-2">
          <Button onClick={() => openRovoChat()} className="w-full">
            📡 Team Radio
          </Button>
          <p className="text-xs text-center text-f1-text-muted">
            Ask your pit crew for guidance
          </p>
        </div>
      </Card>
    </div>
  );
};
