import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { createCalendarTool } from '../tools/calendar.tool';

export class LangChainService {
  private model: ChatOpenAI;

  constructor() {

    // Initialize the ChatOpenAI model.  Using this technique, we can easily switch to a different model if needed
    // and we also get better control of the model. 
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Chat with the AI model and handle tool calls for calendar interactions.
   * @param message 
   * @param accessToken 
   * @param conversationHistory 
   * @returns 
   */
  async chat(message: string, accessToken: string, conversationHistory: any[] = []): Promise<string> {
    console.log('=== LangChain Chat ===');
    console.log('User message:', message);
    console.log('History length:', conversationHistory.length);
    console.log('Access token present:', !!accessToken);
    console.log('OpenAI API key present:', !!process.env.OPENAI_API_KEY);

    try {
      // Create the calendar tool with the user's access token and bind to the model.   
      // Need to do this each time because the access token is user-specific.
      const calendarTool = createCalendarTool(accessToken);
      const modelWithTools = this.model.bindTools([calendarTool]);
      console.log('Calendar tool created:', calendarTool.name);

      // Calculate date ranges for common queries
      const today = new Date();
      const tomorrow = new Date(Date.now() + 86400000);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

      // Build system message
      const systemMessage = new SystemMessage(
        `You are a helpful AI assistant with access to the user's Google Calendar.
You can help users with their schedule, meetings, and appointments.

Current date and time: ${today.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}

When users ask about their schedule:
- ALWAYS use the get_calendar_appointments tool to fetch their appointments
- Provide clear, conversational summaries
- Include relevant details like times, locations, and attendees
- Be proactive in suggesting useful information

IMPORTANT: For date queries, you MUST use these exact formats when calling the tool:

Single day queries (use "date" parameter):
- "today" = ${today.toISOString().split('T')[0]}
- "tomorrow" = ${tomorrow.toISOString().split('T')[0]}

Date range queries (use "startDate" and "endDate" parameters):
- "this week" = startDate: ${startOfWeek.toISOString().split('T')[0]}, endDate: ${endOfWeek.toISOString().split('T')[0]}
- For any multi-day period, calculate the start and end dates and use both parameters

Examples:
- "What do I have today?" → Call tool with date="${today.toISOString().split('T')[0]}"
- "Show my calendar this week" → Call tool with startDate="${startOfWeek.toISOString().split('T')[0]}" and endDate="${endOfWeek.toISOString().split('T')[0]}"`
      );

      // Build messages array
      const messages = [systemMessage, ...conversationHistory, new HumanMessage(message)];

      console.log('Invoking model with', messages.length, 'messages...');

      // Invoke the model
      const response = await modelWithTools.invoke(messages);
      console.log('Model response received');
      console.log('Response type:', response.constructor.name);
      console.log('Has tool calls:', !!response.tool_calls?.length);

      // Check if the model wants to call a tool
      if (response.tool_calls && response.tool_calls.length > 0) {
        console.log('Model requested', response.tool_calls.length, 'tool call(s)');

        // Execute each tool call
        const toolResults = [];
        for (const toolCall of response.tool_calls) {
          console.log('Executing tool:', toolCall.name, 'with args:', toolCall.args);

          // Execute the tool
          const toolResult = await calendarTool.invoke(toolCall.args);
          console.log('Tool result length:', toolResult.length);

          toolResults.push({
            tool_call_id: toolCall.id,
            name: toolCall.name,
            content: toolResult
          });
        }

        // Add tool results to messages and get final response
        const messagesWithToolResults = [
          ...messages,
          response,
          ...toolResults.map(result => ({
            role: 'tool',
            content: result.content,
            tool_call_id: result.tool_call_id
          }))
        ];

        console.log('Getting final response from model...');
        const finalResponse = await this.model.invoke(messagesWithToolResults);
        console.log('Final response:', finalResponse.content);

        return finalResponse.content as string;
      }

      // No tool calls, return direct response
      console.log('No tool calls, returning direct response');
      return response.content as string;

    } catch (error) {
      console.error('Error in LangChain chat:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }
}
