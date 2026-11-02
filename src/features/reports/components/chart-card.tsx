import React from 'react';
export interface ChartCardProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  onExport?: () => void;
}
export const ChartCard: React.FC<ChartCardProps> = () => null;
