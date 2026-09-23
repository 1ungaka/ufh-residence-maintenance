/**
 * Holds the logged-in user for the whole app.
 * Supabase automatically manages local storage tokens and session validation.
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js'; // Ensure this path points to your new Supabase client
import { portalRole } from '../utils/roles.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // True while login() checks the account's role, so a wrong-role sign-in
  // never reaches the rest of the app before it is signed back out.
  const verifyingRole = useRef(false);

  useEffect(() => {
    // 1. Check for an active session when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Automatically listen for login, logout, and token expiration events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (verifyingRole.current) return;
      setUser(session?.user ?? null);
      // Opened from a reset-password email: go and choose a new password,
      // wherever in the app the link happened to land.
      if (event === 'PASSWORD_RECOVERY') navigate('/reset-password', { replace: true });
    });

    // Cleanup the event listener when the component unmounts
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // expectedRole is 'student' or 'maintenance', picked on the sign-in screen.
  const login = async (email, password, expectedRole) => {
    verifyingRole.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const actualRole = portalRole(data.user);
      if (expectedRole && actualRole !== expectedRole) {
        await supabase.auth.signOut();
        const label = actualRole === 'student' ? 'Student' : 'Maintenance tradesperson';
        throw new Error(`This account is registered as a ${label.toLowerCase()}. Choose "${label}" above and sign in again.`);
      }

      setUser(data.user);
      return data.user;
    } finally {
      verifyingRole.current = false;
    }
  };

  const register = async (payload) => {
    // Separate the email/password from the rest of the form data
    const { email, password, ...metaData } = payload;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metaData, // This saves extra fields (like full_name) to the user's Supabase profile
      }
    });
    
    if (error) throw error;
    return data.user;
  };

  // Emails a reset link that brings the user back to /reset-password on this site.
  // The email's wording comes from docs/supabase/reset-password-email.html.
  const requestPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  // For links that carry ?token_hash=... (the custom email template's button).
  // Supabase's default links are handled automatically when the page loads.
  const verifyRecovery = async (tokenHash) => {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    if (error) throw error;
  };

  const updatePassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user, setUser, loading, login, register, logout,
        requestPasswordReset, verifyRecovery, updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}