import axiosClient from "./axiosClient";

export const docService = {
  async getDocuments(searchQuery = "") {
    const response = await axiosClient.get("/documents", {
      params: searchQuery ? { search: searchQuery } : {},
    });
    return response.data;
  },

  async getDocumentById(id) {
    const response = await axiosClient.get(`/documents/${id}`);
    return response.data;
  },

  async createDocument(data = {}) {
    const response = await axiosClient.post("/documents", data);
    return response.data;
  },

  async updateDocument(id, data) {
    const response = await axiosClient.put(`/documents/${id}`, data);
    return response.data;
  },

  async duplicateDocument(id) {
    const response = await axiosClient.post(`/documents/${id}/duplicate`);
    return response.data;
  },

  async deleteDocument(id) {
    const response = await axiosClient.delete(`/documents/${id}`);
    return response.data;
  },

  async shareDocument(id, shareData) {
    const response = await axiosClient.post(`/documents/${id}/share`, shareData);
    return response.data;
  },

  async removeCollaborator(id, userId) {
    const response = await axiosClient.delete(
      `/documents/${id}/collaborators/${userId}`
    );
    return response.data;
  },
};
