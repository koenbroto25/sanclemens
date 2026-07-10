import React from 'react';

interface ApprovalTrackerProps {
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  stages: string[];
  currentStageIndex?: number; // Optional, to highlight the current stage
}

const ApprovalTracker: React.FC<ApprovalTrackerProps> = ({ status, stages, currentStageIndex }) => {
  const getStageStatus = (index: number) => {
    if (status === 'rejected') {
      return 'rejected';
    }
    if (currentStageIndex !== undefined && index < currentStageIndex) {
      return 'completed';
    }
    if (currentStageIndex !== undefined && index === currentStageIndex) {
      return 'current';
    }
    return 'pending';
  };

  const getStatusColor = (stageStatus: string) => {
    switch (stageStatus) {
      case 'completed':
        return 'bg-green-500';
      case 'current':
        return 'bg-yellow-500 animate-pulse';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
      default:
        return 'bg-gray-400';
    }
  };

  const getTextColor = (stageStatus: string) => {
    switch (stageStatus) {
      case 'completed':
        return 'text-green-700';
      case 'current':
        return 'text-yellow-700';
      case 'rejected':
        return 'text-red-700';
      case 'pending':
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col items-start w-full">
      <h3 className="text-md font-semibold mb-3 text-[--color-pintu1-primary]">Status Persetujuan:</h3>
      <div className="flex items-center w-full justify-between">
        {stages.map((stage, index) => {
          const stageStatus = getStageStatus(index);
          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center flex-grow">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                    ${getStatusColor(stageStatus)}`}
                >
                  {status === 'rejected' && stageStatus === 'current' ? '❌' : index + 1}
                </div>
                <p className={`mt-1 text-center text-xs ${getTextColor(stageStatus)}`}>{stage}</p>
              </div>
              {index < stages.length - 1 && (
                <div className="flex-grow h-0.5 bg-gray-300 mx-2"></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export { ApprovalTracker };