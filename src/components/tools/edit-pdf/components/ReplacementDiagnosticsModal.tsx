import React from 'react';

export interface DiagnosticsNoticeProps {
  replacementNotice: string | null;
  overflowDetected?: boolean;
  usedFallbackFont?: boolean;
  hasDigitalSignatures?: boolean;
  tTools: (key: string) => string;
}

export function ReplacementDiagnosticsAlerts({
  replacementNotice,
  overflowDetected,
  usedFallbackFont,
  hasDigitalSignatures,
  tTools,
}: DiagnosticsNoticeProps) {
  return (
    <>
      {replacementNotice && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-800">{replacementNotice}</p>
        </div>
      )}

      {overflowDetected && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3" role="status">
          <p className="text-sm text-amber-900">{tTools('overflowAppliedWarning')}</p>
        </div>
      )}

      {usedFallbackFont && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3" role="status">
          <p className="text-sm text-amber-900">{tTools('fallbackFontWarning')}</p>
        </div>
      )}

      {hasDigitalSignatures && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3" role="alert">
          <p className="text-sm font-medium text-red-800">{tTools('signatureInvalidatedWarning')}</p>
        </div>
      )}
    </>
  );
}
