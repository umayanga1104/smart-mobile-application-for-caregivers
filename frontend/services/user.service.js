import { api } from '../config/axios';

const userService = {
  updateProfilePicture: async (base64Image) => {
    const response = await api.put('/user/profile-picture', {
      profilePicture: base64Image,
    });
    return response.data;
  },

  removeProfilePicture: async () => {
    const response = await api.delete('/user/profile-picture');
    return response.data;
  },
};

export default userService;
