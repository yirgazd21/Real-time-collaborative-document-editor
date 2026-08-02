import axiosClient from "./axiosClient";

export const versionService = {
  async getRevisions(docId) {
    const response = await axiosClient.get(`/documents/${docId}/revisions`);
    return response.data;
  },

  async createRevision(docId, versionName) {
    const response = await axiosClient.post(`/documents/${docId}/revisions`, {
      versionName,
    });
    return response.data;
  },

  async restoreRevision(docId, revisionId) {
    const response = await axiosClient.post(
      `/documents/${docId}/revisions/${revisionId}/restore`
    );
    return response.data;
  },
};
