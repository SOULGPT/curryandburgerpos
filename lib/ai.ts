import Groq from 'groq-sdk';

const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || 'missing-key';

if (apiKey === 'missing-key') {
  console.warn('Missing EXPO_PUBLIC_GROQ_API_KEY. AI features will not work.');
}

const groq = new Groq({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Necessary for client-side Expo usage
});



export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const AIService = {
  /**
   * General chat function for staff assistance
   */
  async chat(messages: ChatMessage[], context?: string) {
    try {
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are "C&B AI", a professional restaurant management assistant for Curry & Burger. 
        You help staff with order management, revenue analysis, and restaurant operations. 
        Keep your tone helpful, efficient, and professional. 
        ${context ? `Current Context: ${context}` : ''}`
      };

      const completion = await groq.chat.completions.create({
        messages: [systemMessage, ...messages],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
    } catch (error) {
      console.error('Groq AI Error:', error);
      return "There was an error connecting to the AI service. Please check your API key.";
    }
  },

  /**
   * Generates a daily performance summary based on order data
   */
  async generateDailySummary(orders: any[]) {
    const orderContext = JSON.stringify(orders.map(o => ({
      number: o.order_number,
      total: o.total_amount,
      items: o.order_items?.length,
      status: o.status
    })));

    return this.chat([
      { role: 'user', content: 'Please provide a brief, insightful summary of today\'s performance.' }
    ], `Today's Orders Data: ${orderContext}`);
  }
};
