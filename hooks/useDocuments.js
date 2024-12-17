import { useReducer } from "react";
export const initialState = {
  documents: [],
};

export const reducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_DOCUMENT":
      const newUpdatedDocuments = state.documents.map((document) => {
        if (action.docId === document.id) {
          return {
            ...document,
            outputBlob: action.outputBlob,
          };
        } else {
          return document;
        }
      });
      return {
        ...state,
        documents: newUpdatedDocuments,
      };

    case "ADD_DOCUMENTS":
      const newAddedDocuments = state.documents.concat([
        { ...action.newDocument },
      ]);
      return {
        ...state,
        documents: newAddedDocuments,
      };

    case "DELETE_DOCUMENT":
    case "ROTATE_DOCUMENT":
    case "ROTATE_ALL_DOCUMENTS":
      return {
        ...state,
        documents: action.newDocuments,
      };

    case "RESET_INITIAL_STATE":
      return initialState;

    default:
      return state;
  }
};

function useDocuments() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleAddDocument = (document) => {
    dispatch({
      type: "ADD_DOCUMENTS",
      newDocument: document,
    });
  };

  const handleUpdateDocument = (outputBlob, docId) => {
    dispatch({
      type: "UPDATE_DOCUMENT",
      docId: parseInt(docId),
      outputBlob: outputBlob,
    });
  };

  const handleDeleteDocument = (documentId) => {
    const documents = state.documents;
    let newDocuments = documents.filter(
      (document) => document.id !== documentId
    );

    dispatch({
      type: "DELETE_DOCUMENT",
      newDocuments,
    });
  };

  const handleRotateDocument = (doc) => {
    const updatedRotationsCounter =
      doc.rotationsCounter + 1 === 4 ? 0 : doc.rotationsCounter + 1;
    const newDocumentsAfterRotation = state.documents.map((document) => {
      if (doc.id === document.id) {
        return {
          ...document,
          rotationsCounter: updatedRotationsCounter,
        };
      } else {
        return document;
      }
    });

    dispatch({
      type: "ROTATE_DOCUMENT",
      newDocuments: newDocumentsAfterRotation,
    });
  };

  const handleRotateAllDocuments = () => {
    const newDocumentsAfterRotation = state.documents.map((document) => {
      const updatedRotationsCounter =
        document.rotationsCounter + 1 === 4 ? 0 : document.rotationsCounter + 1;
      return {
        ...document,
        rotationsCounter: updatedRotationsCounter,
      };
    });

    dispatch({
      type: "ROTATE_ALL_DOCUMENTS",
      newDocuments: newDocumentsAfterRotation,
    });
  };

  const handleResetInitialDocumentsState = () => {
    dispatch({
      type: "RESET_INITIAL_STATE",
    });
  };

  return {
    documents: state.documents,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleRotateDocument,
    handleRotateAllDocuments,
    handleResetInitialDocumentsState,
  };
}

export default useDocuments;
