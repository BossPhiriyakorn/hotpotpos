
import React from 'react';
import { AppScreen } from '../../../types';
import { useLanguage } from '../../../store/LanguageContext';

interface ProgressBarProps {
  currentStep: AppScreen;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  const { t } = useLanguage();

  const steps = [
    { screen: AppScreen.Weighing, label: t('step.weighing') },
    { screen: AppScreen.Customize, label: t('step.customize') },
    { screen: AppScreen.Summary, label: t('step.summary') },
    { screen: AppScreen.PaymentSuccess, label: t('step.success') },
    { screen: AppScreen.MemberScan, label: t('step.member') },
  ];

  const currentStepIndex = steps.findIndex(step => step.screen === currentStep);
  // The progress bar spans between the centers of the first and last steps.
  // Prevent negative progress if step not found or index is 0
  const progressPercentage = currentStepIndex > 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className="w-full px-4 md:px-12 pt-8 pb-4 bg-white">
      <div className="max-w-5xl mx-auto relative">
        {/* Layer 1: The connecting lines, rendered behind the circles. */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] h-1 -translate-y-1/2">
          {/* Base grey line */}
          <div className="w-full h-full bg-slate-200" />
          {/* Red progress line overlay */}
          <div
            className="absolute top-0 left-0 h-full bg-[#BF0A30] transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Layer 2: The step circles and labels */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            
            // Special case: "Payment Success" step should show checkmark when active to match design
            const showCheckmark = isCompleted || (step.screen === AppScreen.PaymentSuccess && isActive);

            return (
              <div key={step.screen} className="flex flex-col items-center text-center w-24">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 z-10 border-4 ${
                    isCompleted || isActive 
                      ? 'bg-[#BF0A30] text-white border-[#BF0A30]' 
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  {showCheckmark ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <p className={`mt-2 text-sm md:text-lg font-bold transition-all duration-300 whitespace-nowrap ${
                    isActive ? 'text-[#BF0A30]' : isCompleted ? 'text-[#BF0A30]' : 'text-slate-400'
                }`}>{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;