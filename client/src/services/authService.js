import axiosClient from "./axiosClient";

export const authService = {
  async register(data) {
    const response = await axiosClient.post("/auth/register", data);
    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
    }
    return response.data;
  },

  async login(data) {
    const response = await axiosClient.post("/auth/login", data);
    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
    }
    return response.data;
  },

  async googleAuth(idToken) {
    const response = await axiosClient.post("/auth/google", { idToken });
    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
    }
    return response.data;
  },

  async getCurrentUser() {
    try {
      const response = await axiosClient.get("/auth/me");
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  },

  async logout() {
    try {
      await axiosClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
    }
  },

  async forgotPassword(email) {
    const response = await axiosClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  async resetPassword(resetToken, password) {
    const response = await axiosClient.post(`/auth/reset-password/${resetToken}`, {
      password,
    });
    return response.data;
  },
};
