import { useReducer } from "react";

const initialState = {
  currentUploadingFile: null,
  currentUploadedFilesCounter: 0,
  currentProccessedFilesCounter: 1,
  totalUploadingProgress: 0,
  uploadSpeed: "",
  uploadTimeLeft: "",
  resultsInfoVisibility: true,
  resultsAlerts: [],
  resultsErrors: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_CURRENT_UPLOADING_STATUS":
      return {
        ...state,
        currentUploadingFile: action.newCurrentUploadingFile,
        currentUploadedFilesCounter: action.newCurrentUploadedFilesCounter,
        totalUploadingProgress: action.newTotalUploadingProgress,
        uploadSpeed: action.newUploadSpeed,
        uploadTimeLeft: action.newUploadTimeLeft,
      };

    case "RESET_CURRENT_UPLOADING_STATUS":
      return {
        ...state,
        currentUploadingFile: initialState.currentUploadingFile,
        currentUploadedFilesCounter: initialState.currentUploadedFilesCounter,
        totalUploadingProgress: initialState.totalUploadingProgress,
        uploadSpeed: initialState.uploadSpeed,
        uploadTimeLeft: initialState.uploadTimeLeft,
      };

    case "UPDATE_RESULTS_DISPLAY":
      return {
        ...state,
        resultsInfoVisibility: action.newProcessingInfoVisibility,
        resultsErrors: action.newProcessingErrors,
        resultsAlerts: action.newProcessingAlerts,
      };

    case "UPDATE_CURRENT_PROCESSING_STATUS":
      return {
        ...state,
        currentProccessedFilesCounter: action.newCurrentProccessedFilesCounter,
      };

    case "RESET_CURRENT_PROCESSING_STATUS":
      return {
        ...state,
        currentProccessedFilesCounter:
          initialState.currentProccessedFilesCounter,
      };

    case "RESET_INITIAL_STATE":
      return initialState;

    default:
      return state;
  }
};

const useUploadStats = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleResetInitialUploadState = () => {
    dispatch({
      type: "RESET_INITIAL_STATE",
    });
  };

  const handleResetCurrentUploadingStatus = () => {
    dispatch({
      type: "RESET_CURRENT_UPLOADING_STATUS",
    });
  };

  const handleUpdateCurrentUploadingStatus = (
    file,
    counter,
    totalProgress,
    loadingSpeed,
    uploadTimeLeft
  ) => {
    dispatch({
      type: "UPDATE_CURRENT_UPLOADING_STATUS",
      newCurrentUploadingFile: file,
      newCurrentUploadedFilesCounter: counter,
      newTotalUploadingProgress: totalProgress,
      newUploadSpeed: loadingSpeed,
      newUploadTimeLeft: uploadTimeLeft,
    });
  };

  const handleUpdateResultsDisplay = (
    resultsInfoVisibility,
    resultsErrors,
    resultsAlerts
  ) => {
    dispatch({
      type: "UPDATE_RESULTS_DISPLAY",
      newProcessingInfoVisibility: resultsInfoVisibility,
      newProcessingErrors: resultsErrors,
      newProcessingAlerts: resultsAlerts,
    });
  };

  const handleResetCurrentProcessingStatus = () => {
    dispatch({
      type: "RESET_CURRENT_PROCESSING_STATUS",
    });
  };

  const handleUpdateCurrentProcessingStatus = (counter) => {
    dispatch({
      type: "UPDATE_CURRENT_PROCESSING_STATUS",
      newCurrentProccessedFilesCounter: counter,
    });
  };

  return {
    currentUploadingFile: state.currentUploadingFile,
    currentUploadedFilesCounter: state.currentUploadedFilesCounter,
    currentProccessedFilesCounter: state.currentProccessedFilesCounter,
    totalUploadingProgress: state.totalUploadingProgress,
    uploadSpeed: state.uploadSpeed,
    uploadTimeLeft: state.uploadTimeLeft,
    resultsInfoVisibility: state.resultsInfoVisibility,
    resultsAlerts: state.resultsAlerts,
    resultsErrors: state.resultsErrors,
    handleResetInitialUploadState,
    handleResetCurrentUploadingStatus,
    handleUpdateCurrentUploadingStatus,
    handleUpdateResultsDisplay,
    handleResetCurrentProcessingStatus,
    handleUpdateCurrentProcessingStatus,
  };
};

export default useUploadStats;
