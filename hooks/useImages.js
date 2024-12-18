import { useReducer } from "react";
import { isMobile } from "react-device-detect";
import { rotatePageRight, updatePagesOrder } from "../helpers/utils.js";

const initialState = {
  pages: [],
  hoverIndex: -1,
  insertIndex: -1,
  currentUploadedFilesCounter: 0,
  currentUploadingFile: null,
  totalUploadingProgress: 0,
  uploadSpeed: "",
  uploadTimeLeft: "",
  resultsInfoVisibility: true,
  resultsErrors: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_PAGES":
      let newPages = state.pages.concat([{ ...action.newPage }]);
      newPages = updatePagesOrder(newPages);
      return {
        ...state,
        pages: newPages,
      };

    case "UPDATE_PAGES":
      return {
        ...state,
        pages: action.newPages,
      };

    case "UPDATE_DOCUMENT":
      const newUpdatedPages = state.pages.map((page) => {
        if (action.docId === page.id) {
          return {
            ...page,
            outputBlob: action.outputBlob,
          };
        } else {
          return page;
        }
      });
      return {
        ...state,
        pages: newUpdatedPages,
      };

    case "CLEAR_SELECTION":
      const newPagesAfterClearingAllSelection = state.pages.map((page) => {
        return { ...page, selected: false };
      });
      return {
        ...state,
        pages: newPagesAfterClearingAllSelection,
      };

    case "SELECT_PAGE":
      const newSelectedPage = action.newSelectedPage;
      const newPagesAfterSelection = state.pages.map((page) => {
        if (newSelectedPage.id === page.id) {
          return { ...page, selected: true };
        } else {
          return page;
        }
      });
      return {
        ...state,
        pages: newPagesAfterSelection,
      };

    case "REMOVE_SELECT_PAGE":
      const newUnselectedPage = action.newUnselectedPage;
      const newPagesAfterDeSelectingPage = state.pages.map((page) => {
        if (newUnselectedPage.id === page.id) {
          return { ...page, selected: false };
        } else {
          return page;
        }
      });
      return {
        ...state,
        pages: newPagesAfterDeSelectingPage,
      };

    case "SET_INSERTINDEX":
      return {
        ...state,
        hoverIndex: action.hoverIndex,
        insertIndex: action.insertIndex,
      };

    case "RESET_INITIAL_STATE":
      return initialState;

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
      };

    default:
      return state;
  }
};

const useImages = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleResetInitialState = () => {
    dispatch({
      type: "RESET_INITIAL_STATE",
    });
  };

  const handleAddPage = (addedPage) => {
    dispatch({
      type: "ADD_PAGES",
      newPage: addedPage,
    });
  };

  const handleClearPageSelection = () => {
    dispatch({ type: "CLEAR_SELECTION" });
  };

  const handlePageSelection = (index) => {
    const pages = state.pages;
    const page = index < 0 ? "" : pages[index];

    dispatch({
      type: "SELECT_PAGE",
      newSelectedPage: page,
    });
  };

  const handleRemovePageSelection = (index) => {
    const pages = state.pages;
    const page = index < 0 ? "" : pages[index];

    dispatch({
      type: "REMOVE_SELECT_PAGE",
      newUnselectedPage: page,
    });
  };

  const handlePagesSelection = (index, ctrlKey) => {
    const pages = state.pages;
    const page = index < 0 ? "" : pages[index];
    if (isMobile) {
      if (page.selected === true) {
        handleRemovePageSelection(index);
      } else {
        handlePageSelection(index);
      }
    } else {
      if (!ctrlKey) {
        handleClearPageSelection();
        handlePageSelection(index);
      } else {
        if (page.selected === true) {
          handleRemovePageSelection(index);
        } else {
          handlePageSelection(index);
        }
      }
    }
  };

  const handleRotatePageRight = (id) => {
    const pages = state.pages;
    let newPages = pages.map((page) => {
      if (page.id === id) {
        const newRotation = rotatePageRight(page.degree);
        return { ...page, degree: newRotation, selected: true };
      } else {
        return { ...page, selected: false };
      }
    });

    dispatch({
      type: "UPDATE_PAGES",
      newPages: newPages,
    });
  };

  const handleRotateSelectedPagesToRight = () => {
    const pages = state.pages;
    //check if no page is selected
    const selectedPagesLength = pages.filter(
      (page) => page.selected === true
    ).length;

    let newPages;
    //if selected pages exist rotate only selected pages, else rotate all the pages
    if (selectedPagesLength > 0) {
      newPages = pages.map((page) => {
        if (page.selected === true) {
          const newRotation = rotatePageRight(page.degree);
          return { ...page, degree: newRotation };
        } else {
          return page;
        }
      });
    } else {
      newPages = pages.map((page) => {
        const newRotation = rotatePageRight(page.degree);
        return { ...page, degree: newRotation };
      });
    }

    dispatch({
      type: "UPDATE_PAGES",
      newPages: newPages,
    });
  };

  const handleMarginChange = (e) => {
    const pages = state.pages;
    //check if no page is selected
    const selectedPagesLength = pages.filter(
      (page) => page.selected === true
    ).length;

    let newPages;
    //if selected pages exist rotate only selected pages, else rotate all the pages
    if (selectedPagesLength > 0) {
      newPages = pages.map((page) => {
        if (page.selected === true) {
          return { ...page, margin: e.target.value };
        } else {
          return page;
        }
      });
    } else {
      newPages = pages.map((page) => {
        return { ...page, margin: e.target.value };
      });
    }

    dispatch({
      type: "UPDATE_PAGES",
      newPages: newPages,
    });
  };

  const handleDeleteSelectedPages = () => {
    const pages = state.pages;
    let newPages = pages.filter((page) => page.selected === false);
    newPages = updatePagesOrder(newPages);

    dispatch({
      type: "UPDATE_PAGES",
      newPages: newPages,
    });
  };

  const handleSetInsertIndex = (hoverIndex, newInsertIndex) => {
    if (
      state.hoverIndex === hoverIndex &&
      state.insertIndex === newInsertIndex
    ) {
      return;
    }
    dispatch({
      type: "SET_INSERTINDEX",
      hoverIndex: hoverIndex,
      insertIndex: newInsertIndex,
    });
  };

  const handleRearrangePages = (dragItem) => {
    let pages = state.pages.slice();
    const draggedPages = dragItem.pages;
    let dividerIndex;
    if ((state.insertIndex >= 0) & (state.insertIndex < pages.length)) {
      dividerIndex = state.insertIndex;
    } else {
      dividerIndex = pages.length;
    }
    const upperHalfRemainingPages = pages
      .slice(0, dividerIndex)
      .filter((c) => !draggedPages.find((dc) => dc.id === c.id));
    const lowerHalfRemainingPages = pages
      .slice(dividerIndex)
      .filter((c) => !draggedPages.find((dc) => dc.id === c.id));
    let newPages = [
      ...upperHalfRemainingPages,
      ...draggedPages,
      ...lowerHalfRemainingPages,
    ];

    newPages = updatePagesOrder(newPages);

    dispatch({
      type: "UPDATE_PAGES",
      newPages: newPages,
      newSelectedPages: draggedPages,
    });
  };

  const handleDeletePage = (id) => {
    const pages = state.pages;
    let newPages = pages.filter((page) => !(id === page.id));
    newPages = updatePagesOrder(newPages);

    dispatch({
      type: "UPDATE_PAGES",
      newPages: newPages,
    });
  };

  const handleUpdateDocument = (outputBlob, docId) => {
    dispatch({
      type: "UPDATE_DOCUMENT",
      docId: parseInt(docId),
      outputBlob: outputBlob,
    });
  };

  const handleOrientationChange = (e) => {
    const pages = state.pages;
    //check if no page is selected
    const selectedPagesLength = pages.filter(
      (page) => page.selected === true
    ).length;

    let newPages;
    //if selected pages exist rotate only selected pages, else rotate all the pages
    if (selectedPagesLength > 0) {
      newPages = pages.map((page) => {
        if (page.selected === true) {
          return { ...page, orientation: e.target.value };
        } else {
          return page;
        }
      });
    } else {
      newPages = pages.map((page) => {
        return { ...page, orientation: e.target.value };
      });
    }

    dispatch({
      type: "UPDATE_PAGES",
      newPages: newPages,
    });
  };

  const handlePageSizeChange = (e) => {
    const pages = state.pages;
    //check if no page is selected
    const selectedPagesLength = pages.filter(
      (page) => page.selected === true
    ).length;

    let newPages;
    //if selected pages exist rotate only selected pages, else rotate all the pages
    if (selectedPagesLength > 0) {
      newPages = pages.map((page) => {
        if (page.selected === true) {
          return { ...page, pageSize: e.target.value };
        } else {
          return page;
        }
      });
    } else {
      newPages = pages.map((page) => {
        return { ...page, pageSize: e.target.value };
      });
    }

    dispatch({
      type: "UPDATE_PAGES",
      newPages: newPages,
    });
  };

  return {
    pages: state.pages,
    hoverIndex: state.hoverIndex,
    insertIndex: state.insertIndex,
    handleResetInitialState,
    handleAddPage,
    handleClearPageSelection,
    handlePageSelection,
    handleRemovePageSelection,
    handlePagesSelection,
    handleRotatePageRight,
    handleRotateSelectedPagesToRight,
    handleMarginChange,
    handleDeleteSelectedPages,
    handleSetInsertIndex,
    handleRearrangePages,
    handleDeletePage,
    handleUpdateDocument,
    handleOrientationChange,
    handlePageSizeChange,
  };
};

export default useImages;
