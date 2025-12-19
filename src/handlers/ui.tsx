/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import ForgeReconciler, { Text, Strong, Box, Heading, Spinner, Stack } from '@forge/react';
import { invoke } from '@forge/bridge';
import { getLoadEmoji, getTimeZoneEmoji } from '../utils/formatting';

/**
 * Dashboard component
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
          <Text>Loading your performance intelligence...</Text>
        </Stack>
      </Box>
    );
  }

  if (!status) {
    return (
      <Box padding="space.200">
        <Heading size="medium">🏎️ Driver Telemetry</Heading>
        <Text>Unable to load dashboard. Complete more tickets to enable analysis or check Rovo chat.</Text>
      </Box>
    );
  }

  return (
    <Box padding="space.200">
      <Heading size="medium">🏎️ Driver Telemetry</Heading>
      
      <Stack space="space.150">
        <Box>
          <Text>
            {getLoadEmoji(status.loadStatus)} <Strong>Load:</Strong> {status.activeTickets} tickets
            {status.loadStatus !== 'optimal' && ` (${status.loadStatus})`}
          </Text>
        </Box>

        <Box>
          <Text>
            {getTimeZoneEmoji(status.currentTimeZone)} <Strong>Zone:</Strong> {status.currentTimeZone}
          </Text>
        </Box>

        {status.sprintProgress?.percentComplete > 0 && (
          <Box>
            <Text>
              <Strong>Sprint:</Strong> {status.sprintProgress.percentComplete}% complete
            </Text>
          </Box>
        )}

        <Box padding="space.100" backgroundColor="color.background.brand.bold.hovered">
          <Stack space="space.050">
            <Text><Strong>💡 Today's Insight:</Strong></Text>
            <Text>{status.todayRecommendations?.[0] || 'No recommendations available'}</Text>
          </Stack>
        </Box>

        <Box>
          <Text size="small">Last updated: {new Date(status.timestamp).toLocaleTimeString()}</Text>
        </Box>
      </Stack>
    </Box>
  );
};

/**
 * Issue panel component
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

  return (
    <Box padding="space.100">
      <Heading size="small">🏎️ Driver Telemetry</Heading>
      
      <Stack space="space.100">
        <Box>
          <Stack space="space.050">
            <Text><Strong>Current Status:</Strong></Text>
            <Text>• Load: {status.activeTickets} tickets ({status.loadStatus})</Text>
            <Text>• Time zone: {status.currentTimeZone}</Text>
          </Stack>
        </Box>

        <Box padding="space.050" backgroundColor="color.background.accent.blue.subtle">
          <Stack space="space.050">
            <Text><Strong>💡 Recommendation:</Strong></Text>
            <Text>{status.todayRecommendations?.[0] || 'No recommendations available'}</Text>
          </Stack>
        </Box>

        <Box>
          <Text size="small">Ask "Driver Telemetry" in Rovo for detailed insights</Text>
        </Box>
      </Stack>
    </Box>
  );
};

// Export render components for UI Kit 2
export const renderDashboard = ForgeReconciler.render(<DashboardApp />);
export const renderIssuePanel = ForgeReconciler.render(<IssuePanelApp />);
