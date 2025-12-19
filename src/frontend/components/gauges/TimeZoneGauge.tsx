/**
 * TimeZoneGauge Component
 * 24-hour timeline visualization showing peak/danger zones
 */

import React from 'react';
import { motion } from 'framer-motion';
import { F1_THEME, RACING_FLAGS } from '../../lib/constants';

interface TimeZoneGaugeProps {
  currentHour: number;
  peakStart: number;
  peakEnd: number;
  dangerStart?: number;
  dangerEnd?: number;
}

export const TimeZoneGauge: React.FC<TimeZoneGaugeProps> = ({
  currentHour,
  peakStart,
  peakEnd,
  dangerStart,
  dangerEnd,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getZone = (hour: number): 'peak' | 'danger' | 'normal' => {
    if (hour >= peakStart && hour <= peakEnd) return 'peak';
    if (dangerStart !== undefined && dangerEnd !== undefined) {
      if (hour >= dangerStart && hour <= dangerEnd) return 'danger';
    }
    return 'normal';
  };

  const getHeight = (zone: 'peak' | 'danger' | 'normal'): string => {
    switch (zone) {
      case 'peak': return '100%';
      case 'danger': return '60%';
      case 'normal': return '40%';
    }
  };

  const getColor = (zone: 'peak' | 'danger' | 'normal'): string => {
    return F1_THEME.timeZone.colors[zone];
  };

  return (
    <div className="space-y-4">
      {/* 24-hour timeline */}
      <div className="relative w-full h-32">
        <div className="flex justify-between items-end h-full gap-0.5">
          {hours.map((hour) => {
            const zone = getZone(hour);
            const isCurrent = hour === currentHour;
            const height = getHeight(zone);
            const color = getColor(zone);

            return (
              <div key={hour} className="relative flex-1">
                <motion.div
                  className="rounded-t transition-all"
                  style={{
                    height,
                    backgroundColor: color,
                    opacity: isCurrent ? 1 : 0.7,
                  }}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {isCurrent && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <div className="text-xs font-bold bg-f1-mercedes px-2 py-1 rounded text-white shadow-lg">
                      {hour}:00
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-2 text-xs text-f1-text-muted">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span>{RACING_FLAGS.green}</span>
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: F1_THEME.timeZone.colors.peak }}
          />
          <span className="text-f1-text-secondary">
            Peak Performance ({peakStart}:00 - {peakEnd}:00)
          </span>
        </div>
        {dangerStart !== undefined && dangerEnd !== undefined && (
          <div className="flex items-center gap-2">
            <span>{RACING_FLAGS.red}</span>
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: F1_THEME.timeZone.colors.danger }}
            />
            <span className="text-f1-text-secondary">
              Danger Zone ({dangerStart}:00 - {dangerEnd}:00)
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span>{RACING_FLAGS.yellow}</span>
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: F1_THEME.timeZone.colors.normal }}
          />
          <span className="text-f1-text-secondary">
            Normal Hours
          </span>
        </div>
      </div>
    </div>
  );
};
