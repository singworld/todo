import { ref } from 'vue';
import { authDb } from '../services/authDb';

const authReady = ref(false);
const isAuthed = ref(false);

export function useAuth() {
  const init = async () => {
    try {
      await authDb.init();
      const session = await authDb.getSession();
      if (session && session.isAuthenticated) {
        isAuthed.value = true;
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      // Fallback or handle error
    } finally {
      authReady.value = true;
    }
  };

  const login = async (password: string): Promise<boolean> => {
    const validPassword = import.meta.env.VITE_APP_PASSWORD || 'password'; // Default if not set
    
    if (password === validPassword) {
      try {
        await authDb.setSession(true);
        isAuthed.value = true;
        return true;
      } catch (error) {
        console.error('Failed to save session:', error);
        // Still allow login for this session if DB fails? 
        // Plan says "Downgrade handling", so yes, maybe just set isAuthed.
        isAuthed.value = true; 
        return true;
      }
    }
    return false;
  };

  return {
    authReady,
    isAuthed,
    init,
    login
  };
}
