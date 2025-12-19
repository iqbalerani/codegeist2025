/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import ForgeReconciler, {
  Text,
  Strong,
  Box,
  Heading,
  Spinner,
  Stack,
  useProductContext,
  Button,
  DonutChart,
  ProgressBar,
  Lozenge,
  Badge
} from '@forge/react';
import { invoke, rovo } from '@forge/bridge';
import { getLoadEmoji, getTimeZoneEmoji } from '../utils/formatting';

/**
 * Helper: Get zone gauge data for DonutChart using REAL timing data
 */
const getZoneGaugeData = (timingData?: {
  currentHour: number;
  peakWindow: { start: number; end: number };
  dangerZone?: { start: number; end: number };
}) => {
  if (!timingData) {
    // Fallback if no timing data available
    return [
      { zone: 'No Data', hours: '0-24', value: 24, color: 'gray' }
    ];
  }

  const { peakWindow, dangerZone } = timingData;
  const segments: any[] = [];

  // Calculate hours for each zone
  // For simplicity, we'll create 3 segments: peak, danger (if exists), and normal (rest)

  const peakHours = (peakWindow.end - peakWindow.start + 24) % 24;
  segments.push({
    zone: `Peak (${peakWindow.start}:00-${peakWindow.end}:00)`,
    hours: `${peakWindow.start}-${peakWindow.end}`,
    value: peakHours,
    color: 'green'
  });

  if (dangerZone) {
    const dangerHours = (dangerZone.end - dangerZone.start + 24) % 24;
    segments.push({
      zone: `Danger (${dangerZone.start}:00-${dangerZone.end}:00)`,
      hours: `${dangerZone.start}-${dangerZone.end}`,
      value: dangerHours,
      color: 'red'
    });

    // Normal is the rest
    const normalHours = 24 - peakHours - dangerHours;
    segments.push({
      zone: 'Normal Hours',
      hours: 'Various',
      value: normalHours,
      color: 'yellow'
    });
  } else {
    // No danger zone, so normal is everything except peak
    const normalHours = 24 - peakHours;
    segments.push({
      zone: 'Normal Hours',
      hours: 'Various',
      value: normalHours,
      color: 'yellow'
    });
  }

  return segments;
};

/**
 * Helper: Get load capacity percentage using REAL load data
 */
const getLoadCapacity = (loadData?: {
  optimalMin: number;
  optimalMax: number;
  currentLoad: number;
}) => {
  if (!loadData) {
    // Fallback if no load data
    return 0.5; // 50%
  }

  const { optimalMin, optimalMax, currentLoad } = loadData;
  const optimalMid = (optimalMin + optimalMax) / 2;

  // Calculate percentage: current / (optimal max * 2) to show when truly overloaded
  // But cap at 100%
  const maxCapacity = optimalMax * 2;
  const percentage = Math.min((currentLoad / maxCapacity) * 100, 100);

  return percentage / 100; // ProgressBar uses 0-1 range
};

/**
 * Helper: Get racing flag for zone
 */
const getRacingFlag = (zone: 'peak' | 'normal' | 'danger') => {
  const flags = {
    peak: '🟢',
    normal: '🟡',
    danger: '🔴'
  };
  return flags[zone];
};

/**
 * Dashboard component for Jira project page
 * Shows comprehensive performance intelligence overview
 */
const DashboardApp = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke('getDashboardStatus')
      .then((data: any) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading status:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box padding="space.200">
        <Heading size="medium">🏎️ Driver Telemetry</Heading>
        <Stack space="space.100" alignBlock="center">
          <Spinner size="large" />
          <Text>Loading your telemetry data...</Text>
        </Stack>
      </Box>
    );
  }

  if (!status) {
    return (
      <Box padding="space.200">
        <Heading size="medium">🏎️ Driver Telemetry</Heading>
        <Text>Unable to load telemetry. Complete more laps to enable analysis or check Rovo chat.</Text>
      </Box>
    );
  }

  const openRovoChat = async (prompt?: string) => {
    try {
      await rovo.open({
        type: 'forge',
        agentKey: 'driver-telemetry-agent',
        agentName: 'Driver Telemetry',
        prompt
      });
    } catch (error) {
      console.error('Error opening Rovo:', error);
    }
  };

  const zoneGaugeData = getZoneGaugeData(status.timingData);
  const loadCapacity = getLoadCapacity(status.loadData);

  return (
    <Box padding="space.200">
      {/* Racing Header */}
      <Stack space="space.100">
        <Heading size="medium">🏎️ Driver Telemetry Dashboard</Heading>
        <Text size="small">Real-time performance analytics</Text>
      </Stack>

      <Stack space="space.200">
        {/* Gauge Cluster Row */}
        <Box>
          <Stack space="space.150">
            {/* Zone Speedometer - Timeline Style */}
            <Box padding="space.150" backgroundColor="color.background.neutral.subtle">
              <Stack space="space.100">
                <Text><Strong>🏁 Track Conditions (24-Hour Timeline)</Strong></Text>

                {/* Current Hour Display - The "Needle" */}
                <Box>
                  <Stack space="space.050" alignInline="center">
                    <Badge appearance="primary">{status.timingData?.currentHour || new Date().getHours()}:00</Badge>
                    <Lozenge
                      appearance={
                        status.currentTimeZone === 'peak' ? 'success' :
                        status.currentTimeZone === 'danger' ? 'removed' :
                        'default'
                      }
                      isBold
                    >
                      {getRacingFlag(status.currentTimeZone)} {status.currentTimeZone.toUpperCase()}
                    </Lozenge>
                  </Stack>
                </Box>

                {/* Timeline Visualization */}
                {status.timingData && (
                  <Stack space="space.075">
                    <Text size="small"><Strong>Peak Performance Window</Strong></Text>
                    <Stack space="space.050">
                      <Text size="small">🟢 {status.timingData.peakWindow.start}:00 - {status.timingData.peakWindow.end}:00</Text>
                      <ProgressBar
                        value={(status.timingData.peakWindow.end - status.timingData.peakWindow.start) / 24}
                        appearance="success"
                      />
                    </Stack>

                    {status.timingData.dangerZone && (
                      <Stack space="space.050">
                        <Text size="small"><Strong>Danger Zone</Strong></Text>
                        <Text size="small">🔴 {status.timingData.dangerZone.start}:00 - {status.timingData.dangerZone.end}:00</Text>
                        <ProgressBar
                          value={(status.timingData.dangerZone.end - status.timingData.dangerZone.start) / 24}
                          appearance="default"
                        />
                      </Stack>
                    )}

                    <Text size="small">🟡 Normal hours: Remaining time</Text>
                  </Stack>
                )}

                <Text size="small">Based on your historical performance patterns</Text>
              </Stack>
            </Box>

            {/* Load Capacity Fuel Gauge */}
            <Box padding="space.150" backgroundColor="color.background.neutral.subtle">
              <Stack space="space.100">
                <Text><Strong>⛽ Fuel Load Capacity</Strong></Text>
                <Stack space="space.050">
                  <Box>
                    <Badge>{status.activeTickets}</Badge>
                    <Text size="small"> active tickets</Text>
                    {status.loadData && (
                      <Text size="small"> (Optimal: {status.loadData.optimalMin}-{status.loadData.optimalMax})</Text>
                    )}
                  </Box>
                  <ProgressBar
                    value={loadCapacity}
                    appearance={
                      status.loadStatus === 'optimal' ? 'success' :
                      status.loadStatus === 'critical' || status.loadStatus === 'over' ? 'default' :
                      'success'
                    }
                  />
                  <Lozenge
                    appearance={
                      status.loadStatus === 'optimal' ? 'success' :
                      status.loadStatus === 'critical' ? 'removed' :
                      status.loadStatus === 'over' ? 'moved' :
                      'default'
                    }
                  >
                    {getLoadEmoji(status.loadStatus)} {status.loadStatus.toUpperCase()}
                  </Lozenge>
                </Stack>
                {(status.loadStatus === 'over' || status.loadStatus === 'critical') && (
                  <Text size="small">⚠️ Pit stop recommended - reduce load to optimal range</Text>
                )}
                {status.loadStatus === 'optimal' && (
                  <Text size="small">🏆 Perfect balance - optimal racing weight achieved</Text>
                )}
                {status.loadStatus === 'under' && status.loadData && (
                  <Text size="small">💡 You can take on {status.loadData.optimalMin - status.activeTickets} more tickets</Text>
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Sprint Progress */}
        {status.sprintProgress?.percentComplete > 0 && (
          <Box padding="space.150" backgroundColor="color.background.accent.gray.subtler">
            <Stack space="space.075">
              <Text><Strong>🏁 Current Lap Progress</Strong></Text>
              <ProgressBar value={status.sprintProgress.percentComplete / 100} />
              <Text size="small">{status.sprintProgress.percentComplete}% complete</Text>
            </Stack>
          </Box>
        )}

        {/* Pit Strategy - Insights */}
        <Box padding="space.150" backgroundColor="color.background.accent.blue.subtler">
          <Stack space="space.100">
            <Text><Strong>🎯 Pit Strategy</Strong></Text>
            {status.todayRecommendations && status.todayRecommendations.length > 0 ? (
              status.todayRecommendations.map((rec: string, idx: number) => (
                <Text key={idx} size="small">{rec}</Text>
              ))
            ) : (
              <Text size="small">No strategy recommendations available</Text>
            )}
          </Stack>
        </Box>

        {/* Rovo Chat Integration */}
        <Box padding="space.150" backgroundColor="color.background.accent.purple.subtler">
          <Stack space="space.100">
            <Text><Strong>📡 Team Radio</Strong></Text>
            <Text size="small">Ask your pit crew for personalized guidance</Text>
            <Stack space="space.050">
              <Button
                appearance="primary"
                onClick={() => openRovoChat()}
              >
                Open Team Radio
              </Button>
              <Stack space="space.050">
                <Text size="small"><Strong>Quick questions:</Strong></Text>
                <Button
                  appearance="subtle"
                  onClick={() => openRovoChat('When do I do my best work?')}
                >
                  🕐 When do I do my best work?
                </Button>
                <Button
                  appearance="subtle"
                  onClick={() => openRovoChat('What should I work on next?')}
                >
                  🎯 What should I work on next?
                </Button>
                <Button
                  appearance="subtle"
                  onClick={() => openRovoChat('Am I taking on too much?')}
                >
                  ⚠️ Am I taking on too much?
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        <Box>
          <Text size="small">📊 Telemetry updated: {new Date(status.timestamp).toLocaleTimeString()}</Text>
        </Box>
      </Stack>
    </Box>
  );
};

/**
 * Issue panel component for individual Jira issues
 * Shows contextual insights for the current issue
 */
const IssuePanelApp = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke('getIssuePanelStatus')
      .then((data: any) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading status:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box padding="space.100">
        <Spinner size="small" />
        <Text>Loading telemetry...</Text>
      </Box>
    );
  }

  if (!status) {
    return (
      <Box padding="space.100">
        <Text>Ask "Driver Telemetry" in Rovo chat for personalized insights.</Text>
      </Box>
    );
  }

  const openRovoChat = async (prompt?: string) => {
    try {
      await rovo.open({
        type: 'forge',
        agentKey: 'driver-telemetry-agent',
        agentName: 'Driver Telemetry',
        prompt
      });
    } catch (error) {
      console.error('Error opening Rovo:', error);
    }
  };

  const loadCapacity = getLoadCapacity(status.loadData);

  return (
    <Box padding="space.100">
      <Heading size="small">🏎️ Telemetry</Heading>

      <Stack space="space.100">
        {/* Quick Status Gauges */}
        <Box>
          <Stack space="space.075">
            <Stack space="space.050">
              <Text size="small"><Strong>🏁 Track:</Strong></Text>
              <Lozenge
                appearance={
                  status.currentTimeZone === 'peak' ? 'success' :
                  status.currentTimeZone === 'danger' ? 'removed' :
                  'default'
                }
                isBold
              >
                {getRacingFlag(status.currentTimeZone)} {status.currentTimeZone.toUpperCase()}
              </Lozenge>
              {status.timingData && (
                <Text size="small">Now: {status.timingData.currentHour}:00</Text>
              )}
            </Stack>
            <Stack space="space.050">
              <Text size="small"><Strong>⛽ Load:</Strong></Text>
              <Box>
                <Badge>{status.activeTickets}</Badge>
                <Text size="small"> tickets</Text>
                {status.loadData && (
                  <Text size="small"> (Opt: {status.loadData.optimalMin}-{status.loadData.optimalMax})</Text>
                )}
              </Box>
              <ProgressBar
                value={loadCapacity}
                appearance={status.loadStatus === 'optimal' ? 'success' : 'default'}
              />
              <Lozenge
                appearance={
                  status.loadStatus === 'optimal' ? 'success' :
                  status.loadStatus === 'critical' ? 'removed' :
                  status.loadStatus === 'over' ? 'moved' :
                  'default'
                }
              >
                {status.loadStatus.toUpperCase()}
              </Lozenge>
            </Stack>
          </Stack>
        </Box>

        {/* Pit Strategy */}
        <Box padding="space.100" backgroundColor="color.background.accent.blue.subtler">
          <Stack space="space.075">
            <Text><Strong>🎯 Pit Strategy</Strong></Text>
            {status.todayRecommendations && status.todayRecommendations.slice(0, 6).map((rec: string, idx: number) => (
              <Text key={idx} size="small">{rec}</Text>
            ))}
          </Stack>
        </Box>

        {/* Team Radio */}
        <Box>
          <Stack space="space.050">
            <Button
              appearance="primary"
              onClick={() => openRovoChat()}
            >
              📡 Team Radio
            </Button>
            <Text size="small">Ask your pit crew for guidance</Text>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

/**
 * Root App component - Routes to correct view based on extension context
 * UI Kit 2 allows one resource to serve multiple modules
 */
const App = () => {
  const context = useProductContext();

  // Context may be undefined initially while loading
  if (!context) {
    return (
      <Box padding="space.100">
        <Spinner size="small" />
      </Box>
    );
  }

  // Route based on extension type
  // jira:issuePanel shows compact issue-specific view
  // jira:projectPage shows full dashboard
  if (context.extension?.type === 'jira:issuePanel') {
    return <IssuePanelApp />;
  }

  return <DashboardApp />;
};

// Render the router component
ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
