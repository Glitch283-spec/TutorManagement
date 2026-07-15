import { api } from '../lib/api';
import { Profile } from '../types';

export const profileService = {
  async getProfileByEmail(_email: string): Promise<Profile | null> {
    try {
      const { data } = await api.get<{ profile: Profile }>('/auth/me');
      return data.profile ?? null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
};
