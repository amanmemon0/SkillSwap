const supabase = require('../config/db');

// @desc    Get all notifications for the authenticated user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json(notifications);
  } catch (error) {
    return next(error);
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if notification exists and belongs to the user
    const { data: checkNotification, error: checkErr } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (checkErr || !checkNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (checkNotification.profile_id !== userId) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to update this notification' });
    }

    // Update read status
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json(notification);
  } catch (error) {
    return next(error);
  }
};

// @desc    Mark all notifications for the user as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('profile_id', userId)
      .select();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({ message: 'All notifications marked as read', count: data.length });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead
};
