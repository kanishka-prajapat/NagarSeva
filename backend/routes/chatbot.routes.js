const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Complaint, Department, User, ChatMessage } = require('../models');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');// Optional auth middleware (chatbot works for both guests and logged-in users)
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {}
  }
  next();
};

// Fetch relevant DB context based on user message
async function fetchDBContext(message, userId) {
  const lowerMsg = message.toLowerCase();
  let context = {};

  // Check for complaint ID pattern (e.g., CMP-2024-001 or just a number)
  const complaintIdMatch = message.match(/CMP-[\w-]+/i) || message.match(/complaint.*?#?(\d+)/i);

  try {
    // Fetch complaint status by ID
    if (complaintIdMatch) {
      const searchId = complaintIdMatch[0];
      const complaint = await Complaint.findOne({
        complaintId: { $regex: searchId, $options: 'i' }
      }).populate('departmentId', 'name').populate('assignedTo', 'name').populate('citizenId', 'name email');
      
      if (complaint) {
        context.specificComplaint = {
          id: complaint.complaintId,
          title: complaint.title,
          description: complaint.description,
          status: complaint.status,
          category: complaint.category,
          priority: complaint.priority,
          department: complaint.departmentId?.name || 'Not assigned',
          assignedWorker: complaint.assignedTo?.name || 'Not assigned yet',
          createdAt: complaint.createdAt,
          completedAt: complaint.completedAt,
          location: complaint.location?.address || 'Location not specified',
          expense: complaint.expense
        };
      }
    }

    // Fetch user's own complaints if logged in
    if (userId && (lowerMsg.includes('my complaint') || lowerMsg.includes('my status') || lowerMsg.includes('my grievance') || lowerMsg.includes('track'))) {
      const userComplaints = await Complaint.find({ citizenId: userId })
        .populate('departmentId', 'name')
        .sort({ createdAt: -1 })
        .limit(5);
      
      context.userComplaints = userComplaints.map(c => ({
        id: c.complaintId,
        title: c.title,
        status: c.status,
        category: c.category,
        priority: c.priority,
        department: c.departmentId?.name || 'Not assigned',
        createdAt: c.createdAt,
        completedAt: c.completedAt
      }));
    }

    // Fetch general stats if asking about statistics or overview
    if (lowerMsg.includes('stat') || lowerMsg.includes('total') || lowerMsg.includes('how many') || lowerMsg.includes('count') || lowerMsg.includes('report') || lowerMsg.includes('overview')) {
      const [total, resolved, pending, inProgress] = await Promise.all([
        Complaint.countDocuments(),
        Complaint.countDocuments({ status: 'completed' }),
        Complaint.countDocuments({ status: 'pending' }),
        Complaint.countDocuments({ status: 'in_progress' })
      ]);

      const categoryStats = await Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      context.stats = { total, resolved, pending, inProgress, categoryStats };
    }

    // Fetch department info if asked
    if (lowerMsg.includes('department') || lowerMsg.includes('dept')) {
      const departments = await Department.find().limit(10);
      context.departments = departments.map(d => ({
        name: d.name,
        total: d.totalComplaints,
        resolved: d.resolved,
        pending: d.pending,
        expense: d.totalExpense
      }));
    }

    // Fetch recent complaints for general queries
    if (lowerMsg.includes('recent') || lowerMsg.includes('latest') || lowerMsg.includes('new complaint')) {
      const recent = await Complaint.find()
        .populate('departmentId', 'name')
        .sort({ createdAt: -1 })
        .limit(5);
      
      context.recentComplaints = recent.map(c => ({
        id: c.complaintId,
        title: c.title,
        status: c.status,
        category: c.category,
        createdAt: c.createdAt
      }));
    }

    // Check pending complaints for a category
    const categories = ['road', 'water', 'garbage', 'electricity', 'sanitation', 'drainage', 'park', 'street light'];
    const matchedCategory = categories.find(cat => lowerMsg.includes(cat));
    if (matchedCategory) {
      const categoryComplaints = await Complaint.find({ category: matchedCategory })
        .sort({ createdAt: -1 })
        .limit(5);
      
      context.categoryComplaints = {
        category: matchedCategory,
        total: categoryComplaints.length,
        complaints: categoryComplaints.map(c => ({
          id: c.complaintId,
          title: c.title,
          status: c.status,
          createdAt: c.createdAt
        }))
      };
    }

  } catch (err) {
    console.error('DB context fetch error:', err.message);
  }

  return context;
}

// Build system prompt with DB context
function buildSystemPrompt(dbContext, userInfo) {
  let systemPrompt = `You are an AI assistant for the Smart Citizen Grievance Redressal System. Your job is to:
1. Help citizens file complaints (guide them through the process)
2. Answer questions about complaint status using real database data
3. Provide information about departments and their performance
4. Help citizens understand the credit/reward system
5. Answer general questions about the grievance portal

Be friendly, concise, and helpful. Always respond in the same language the user writes in (Hindi or English).

Current User: ${userInfo ? `Logged in as ${userInfo.name || 'citizen'} (${userInfo.role || 'citizen'}). They have ${userInfo.credits || 0} credit points.` : 'Guest user (not logged in)'}

HOW TO FILE A COMPLAINT:
- Login/Register at the portal
- Go to "Submit Complaint" 
- Fill title, description
- Upload an image (optional but recommended)
- Allow location access or enter manually
- Submit - you'll get a complaint ID
- Track via "My Complaints" section

COMPLAINT CATEGORIES: Road, Water, Garbage, Electricity, Sanitation, Drainage, Park, Street Light, Other

CREDIT SYSTEM: Each genuine complaint earns +10 credits. Every 3 months, 100 credits = ₹100 reward.

COMPLAINT STATUS MEANINGS:
- Pending: Received, awaiting assignment
- In Progress: Being worked on by a worker
- Completed: Issue resolved
- Rejected: Invalid/duplicate complaint

`;

  if (dbContext.specificComplaint) {
    const c = dbContext.specificComplaint;
    systemPrompt += `\n📋 FETCHED COMPLAINT DATA FROM DATABASE:
Complaint ID: ${c.id}
Title: ${c.title}
Description: ${c.description}
Status: ${c.status.toUpperCase()}
Category: ${c.category}
Priority: ${c.priority}
Department: ${c.department}
Assigned Worker: ${c.assignedWorker}
Location: ${c.location}
Filed On: ${new Date(c.createdAt).toLocaleDateString('en-IN')}
${c.completedAt ? `Completed On: ${new Date(c.completedAt).toLocaleDateString('en-IN')}` : ''}
${c.expense > 0 ? `Expense: ₹${c.expense}` : ''}

Use this real data to answer the user's query about this complaint.\n`;
  }

  if (dbContext.userComplaints && dbContext.userComplaints.length > 0) {
    systemPrompt += `\n📋 USER'S RECENT COMPLAINTS FROM DATABASE:\n`;
    dbContext.userComplaints.forEach((c, i) => {
      systemPrompt += `${i + 1}. [${c.id}] ${c.title} - Status: ${c.status} | Dept: ${c.department} | Filed: ${new Date(c.createdAt).toLocaleDateString('en-IN')}\n`;
    });
    systemPrompt += '\n';
  }

  if (dbContext.stats) {
    const s = dbContext.stats;
    systemPrompt += `\n📊 LIVE STATISTICS FROM DATABASE:
Total Complaints: ${s.total}
Resolved: ${s.resolved}
In Progress: ${s.inProgress}
Pending: ${s.pending}
Resolution Rate: ${s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0}%
Top Categories: ${s.categoryStats.map(c => `${c._id}(${c.count})`).join(', ')}
\n`;
  }

  if (dbContext.departments && dbContext.departments.length > 0) {
    systemPrompt += `\n🏢 DEPARTMENT DATA FROM DATABASE:\n`;
    dbContext.departments.forEach(d => {
      systemPrompt += `- ${d.name}: ${d.total} total, ${d.resolved} resolved, ${d.pending} pending, ₹${d.expense} spent\n`;
    });
    systemPrompt += '\n';
  }

  if (dbContext.recentComplaints) {
    systemPrompt += `\n🕐 RECENT COMPLAINTS:\n`;
    dbContext.recentComplaints.forEach((c, i) => {
      systemPrompt += `${i + 1}. [${c.id}] ${c.title} - ${c.status} (${c.category})\n`;
    });
    systemPrompt += '\n';
  }

  if (dbContext.categoryComplaints) {
    const cc = dbContext.categoryComplaints;
    systemPrompt += `\n📍 ${cc.category.toUpperCase()} COMPLAINTS: ${cc.total} found\n`;
    cc.complaints.forEach((c, i) => {
      systemPrompt += `${i + 1}. [${c.id}] ${c.title} - ${c.status}\n`;
    });
    systemPrompt += '\n';
  }

  systemPrompt += `\nIMPORTANT: Use the above real database data in your answers. Be specific with complaint IDs, statuses, and dates. If asked about something not in the data, say the information isn't available and guide them to the portal.`;

  return systemPrompt;
}

// Main chat endpoint
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, sessionId, history = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch relevant DB context
    const dbContext = await fetchDBContext(message, req.user?.id);

    // Get user info if logged in
    let userInfo = null;
    if (req.user?.id) {
      userInfo = await User.findById(req.user.id).select('name role credits').lean();
    }

    const systemPrompt = buildSystemPrompt(dbContext, userInfo);

    // Build messages array for Claude API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemPrompt
    });

    // Extract complete user-assistant pairs to ensure valid Gemini history format
    let geminiHistory = [];
    let lastUserMsg = null;
    
    for (const h of history) {
      if (h.role === 'user') {
        lastUserMsg = h.content;
      } else if (h.role === 'assistant' && lastUserMsg) {
        geminiHistory.push({ role: 'user', parts: [{ text: lastUserMsg }] });
        geminiHistory.push({ role: 'model', parts: [{ text: h.content }] });
        lastUserMsg = null;
      }
    }
    
    // Keep only the last 10 messages (5 valid pairs)
    geminiHistory = geminiHistory.slice(-10);

    // Start chat with history
    const chat = model.startChat({ history: geminiHistory });
    
    // Call Gemini API
    const result = await chat.sendMessage(message);
    const assistantMessage = result.response.text();

    // Save to chat history (optional)
    if (sessionId) {
      await ChatMessage.insertMany([
        { sessionId, userId: req.user?.id, role: 'user', content: message },
        { sessionId, userId: req.user?.id, role: 'assistant', content: assistantMessage }
      ]);
    }

    res.json({
      reply: assistantMessage,
      dbContext: Object.keys(dbContext).length > 0 ? dbContext : null
    });

  } catch (err) {
    console.error('Chatbot error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Chatbot service error',
      reply: 'I\'m having trouble connecting right now. Please try again in a moment, or visit the portal directly for assistance.'
    });
  }
});

// Get chat history for a session
router.get('/history/:sessionId', optionalAuth, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ sessionId: req.params.sessionId })
      .sort({ createdAt: 1 })
      .limit(50);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Quick complaint status check endpoint
router.get('/status/:complaintId', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.complaintId })
      .populate('departmentId', 'name')
      .populate('assignedTo', 'name');
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({
      id: complaint.complaintId,
      title: complaint.title,
      status: complaint.status,
      category: complaint.category,
      priority: complaint.priority,
      department: complaint.departmentId?.name,
      assignedTo: complaint.assignedTo?.name,
      createdAt: complaint.createdAt,
      completedAt: complaint.completedAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

module.exports = router;
