import React from 'react';

export interface ServiceFormProps {
  service?: unknown;
}

export interface ServiceFormDialogProps {
  onClose: () => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = () => null;
export const ServiceFormDialog: React.FC<ServiceFormDialogProps> = () => null;
