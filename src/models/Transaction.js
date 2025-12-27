import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['add', 'minus'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  usdAmount: { 
    type: Number, 
    required: true 
  },
  bdtAmount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    enum: ['BDT', 'USD'], 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);