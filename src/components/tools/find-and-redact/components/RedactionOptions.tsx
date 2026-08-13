import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { RedactionOptionsState } from '../types';

interface RedactionOptionsProps {
    redactionOptions: RedactionOptionsState;
    onRedactionOptionsChange: (options: RedactionOptionsState) => void;
    disabled: boolean;
}

export function RedactionOptions({
    redactionOptions,
    onRedactionOptionsChange,
    disabled,
}: RedactionOptionsProps) {
    const tTools = useTranslations('tools.findAndRedact');

    return (
        <Card variant="outlined" size="lg">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
                {tTools('redactionOptions')}
            </h3>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            {tTools('redactionColor')}
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={redactionOptions.color}
                                onChange={(e) =>
                                    onRedactionOptionsChange({ ...redactionOptions, color: e.target.value })
                                }
                                className="w-10 h-10 p-1 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
                                disabled={disabled}
                            />
                            <input
                                type="text"
                                value={redactionOptions.color}
                                onChange={(e) =>
                                    onRedactionOptionsChange({ ...redactionOptions, color: e.target.value })
                                }
                                className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm"
                                disabled={disabled}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            {tTools('replacementText')}
                        </label>
                        <input
                            type="text"
                            value={redactionOptions.replacementText}
                            onChange={(e) =>
                                onRedactionOptionsChange({ ...redactionOptions, replacementText: e.target.value })
                            }
                            placeholder={tTools('replacementTextPlaceholder')}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            disabled={disabled}
                        />
                    </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={redactionOptions.addBorder}
                        onChange={(e) =>
                            onRedactionOptionsChange({ ...redactionOptions, addBorder: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600"
                        disabled={disabled}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        {tTools('addBorder')}
                    </span>
                </label>

                {/* Security Warning */}
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                    <p className="text-sm">
                        <strong>{tTools('warningTitle')}:</strong> {tTools('warningText')}
                    </p>
                </div>
            </div>
        </Card>
    );
}
