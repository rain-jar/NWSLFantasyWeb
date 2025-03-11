import { supabase } from './supabaseClient';

export const signUpUser = async (email, password, username) => {
  // Step 1: Create a new user in Supabase Auth
  console.log("In auth function");
  console.log("Email:", email, "Password:", password);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error("Signup Error:", authError.message);
    return { success: false, error: authError.message };
  }

  // Step 2: Insert the user into 'users' table with auth.users.id
  const userId = authData.user.id;
  const { error: profileError } = await supabase
    .from("users")
    .insert([{ id: userId, user_name: username }]);

  if (profileError) {
    console.error("Profile Creation Error:", profileError.message);
    return { success: false, error: profileError.message };
  }else{
    console.log("Inserted new user and returning to SignUpScreen");
  }

  // Step 3: Return success and navigate to the next screen
  return { success: true, userId };
};

export const loginUser = async (email, password) => {
  console.log("Inside Login Auth");
  // Step 1: Authenticate user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error("Login Error:", authError.message);
    return { success: false, error: authError.message };
  }

  const userId = authData.user.id;

  console.log("Fetching user based on Auth id")
  // Step 2: Fetch user profile from 'users' table
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Profile Fetch Error:", profileError.message);
    return { success: false, error: profileError.message };
  }else{
    console.log("User fetched and returning to login page ", userProfile);
  }

  // Step 3: Return user data
  return { success: true, user: userProfile, userId: userId };
};

export const resetPassword = async (email) => {
  console.log("Resetting password for:", email);
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://wosofantasy.com/update-password",

  });

  if (error) {
    console.error("Error sending reset email:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, message: "Password reset email sent!" };
};
