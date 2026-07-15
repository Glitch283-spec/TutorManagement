const { supabaseAdmin } = require("../lib/supabaseAdmin");

async function getProfileByUserId(userId) {
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("user_id, full_name, email, role, status")
    .eq("user_id", userId)
    .single();

  if (userError || !user) {
    return null;
  }

  const profile = {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  };

  if (user.role === "parent") {
    const { data } = await supabaseAdmin
      .from("parents")
      .select("parent_id")
      .eq("user_id", user.user_id)
      .single();
    if (data) profile.parent_id = data.parent_id;
  }

  if (user.role === "manager") {
    const { data } = await supabaseAdmin
      .from("managers")
      .select("manager_id")
      .eq("user_id", user.user_id)
      .single();
    if (data) profile.manager_id = data.manager_id;
  }

  if (user.role === "tutor") {
    const { data } = await supabaseAdmin
      .from("tutors")
      .select("tutor_id")
      .eq("user_id", user.user_id)
      .single();
    if (data) profile.tutor_id = data.tutor_id;
  }

  return profile;
}

async function getProfileByEmail(email) {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("user_id")
    .eq("email", email)
    .single();

  if (error || !user) {
    return null;
  }

  return getProfileByUserId(user.user_id);
}

module.exports = { getProfileByUserId, getProfileByEmail };
