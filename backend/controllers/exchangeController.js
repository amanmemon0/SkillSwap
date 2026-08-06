const supabase = require('../config/db');

// @desc    Create a new skill exchange request
// @route   POST /api/exchanges
// @access  Private
const createExchange = async (req, res, next) => {
  try {
    const { receiverId, senderSkillId, receiverSkillId, message } = req.body;
    const senderId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver profile ID is required' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ message: 'You cannot initiate a skill exchange with yourself' });
    }

    if (!senderSkillId || !receiverSkillId) {
      return res.status(400).json({ message: 'Both sender and receiver skill IDs are required' });
    }

    // Fetch sender skill name
    const { data: senderSkill, error: senderSkillErr } = await supabase
      .from('skills')
      .select('name')
      .eq('id', senderSkillId)
      .maybeSingle();

    if (senderSkillErr || !senderSkill) {
      return res.status(404).json({ message: 'Sender skill not found' });
    }

    // Fetch receiver skill name
    const { data: receiverSkill, error: receiverSkillErr } = await supabase
      .from('skills')
      .select('name')
      .eq('id', receiverSkillId)
      .maybeSingle();

    if (receiverSkillErr || !receiverSkill) {
      return res.status(404).json({ message: 'Receiver skill not found' });
    }

    // Insert exchange request
    const { data: exchange, error: exchangeErr } = await supabase
      .from('exchanges')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          sender_skill_id: senderSkillId,
          receiver_skill_id: receiverSkillId,
          sender_skill_name: senderSkill.name,
          receiver_skill_name: receiverSkill.name,
          message: message || '',
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (exchangeErr || !exchange) {
      return res.status(400).json({ message: exchangeErr?.message || 'Unable to create exchange request' });
    }

    return res.status(201).json(exchange);
  } catch (error) {
    return next(error);
  }
};

// @desc    Get user exchanges (both sent and received)
// @route   GET /api/exchanges
// @access  Private
const getExchanges = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: exchanges, error } = await supabase
      .from('exchanges')
      .select(`
        *,
        sender:profiles!exchanges_sender_id_fkey(id, full_name, username),
        receiver:profiles!exchanges_receiver_id_fkey(id, full_name, username)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json(exchanges);
  } catch (error) {
    return next(error);
  }
};

// @desc    Update exchange request status
// @route   PUT /api/exchanges/:id/status
// @access  Private
const updateExchangeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const allowedStatuses = ['matched', 'completed', 'sender_cancelled', 'receiver_declined'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    // Fetch the exchange
    const { data: exchange, error: getErr } = await supabase
      .from('exchanges')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (getErr || !exchange) {
      return res.status(404).json({ message: 'Exchange not found' });
    }

    // Authorization checks
    const isSender = exchange.sender_id === userId;
    const isReceiver = exchange.receiver_id === userId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to update this exchange' });
    }

    // Validate transitions
    if (status === 'matched') {
      if (!isReceiver) {
        return res.status(403).json({ message: 'Forbidden: Only the receiver can accept the exchange request' });
      }
      if (exchange.status !== 'pending') {
        return res.status(400).json({ message: `Cannot accept exchange with current status: ${exchange.status}` });
      }
    }

    if (status === 'receiver_declined') {
      if (!isReceiver) {
        return res.status(403).json({ message: 'Forbidden: Only the receiver can decline the exchange request' });
      }
      if (exchange.status !== 'pending' && exchange.status !== 'matched') {
        return res.status(400).json({ message: `Cannot decline exchange with current status: ${exchange.status}` });
      }
    }

    if (status === 'sender_cancelled') {
      if (!isSender) {
        return res.status(403).json({ message: 'Forbidden: Only the sender can cancel the exchange request' });
      }
      if (exchange.status !== 'pending' && exchange.status !== 'matched') {
        return res.status(400).json({ message: `Cannot cancel exchange with current status: ${exchange.status}` });
      }
    }

    if (status === 'completed') {
      if (exchange.status !== 'matched') {
        return res.status(400).json({ message: 'Only active exchanges (status: matched) can be marked as completed' });
      }
    }

    // Update status
    const { data: updatedExchange, error: updateErr } = await supabase
      .from('exchanges')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updatedExchange) {
      return res.status(400).json({ message: updateErr?.message || 'Unable to update exchange status' });
    }

    return res.status(200).json(updatedExchange);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createExchange,
  getExchanges,
  updateExchangeStatus
};
