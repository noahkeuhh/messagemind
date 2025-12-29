import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { config } from '../config/index.js';

const router = Router();

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate reset token and send email via Supabase Admin
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.frontendUrl}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ 
      success: true, 
      message: 'Password reset email sent successfully' 
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { access_token, new_password } = req.body;

    if (!access_token || !new_password) {
      return res.status(400).json({ error: 'Access token and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Update user password using admin client
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.getUser(access_token);

    if (getUserError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    res.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
