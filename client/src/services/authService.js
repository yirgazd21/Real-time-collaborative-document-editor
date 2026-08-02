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
    const response = await axiosClient.get("/auth/me");
    return response.data;
  },

  async logout() {
    try {
      await axiosClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
    }
  },
};
