/**
 * Holds the logged-in user for the whole app.
 * Supabase automatically manages local storage tokens and session validation.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js'; // Ensure this path points to your new Supabase client

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for an active session when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Automatically listen for login, logout, and token expiration events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup the event listener when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // You do not need to call setUser manually; onAuthStateChange handles it.
    return data.user;
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

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}