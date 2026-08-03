import axiosClient from "./axiosClient";

export const commentService = {
  async getComments(docId) {
    const response = await axiosClient.get(`/documents/${docId}/comments`);
    return response.data;
  },

  async addComment(docId, content) {
    const response = await axiosClient.post(`/documents/${docId}/comments`, {
      content,
    });
    return response.data;
  },

  async updateComment(docId, commentId, content) {
    const response = await axiosClient.put(
      `/documents/${docId}/comments/${commentId}`,
      { content }
    );
    return response.data;
  },

  async addReply(docId, commentId, content) {
    const response = await axiosClient.post(
      `/documents/${docId}/comments/${commentId}/reply`,
      { content }
    );
    return response.data;
  },

  async toggleResolve(docId, commentId) {
    const response = await axiosClient.patch(
      `/documents/${docId}/comments/${commentId}/resolve`
    );
    return response.data;
  },

  async deleteComment(docId, commentId) {
    const response = await axiosClient.delete(
      `/documents/${docId}/comments/${commentId}`
    );
    return response.data;
  },

  async deleteReply(docId, commentId, replyId) {
    const response = await axiosClient.delete(
      `/documents/${docId}/comments/${commentId}/replies/${replyId}`
    );
    return response.data;
  },
};
