import { lumic, Tool, LLMResponse } from 'lumic-utility-functions';
import { allTools, executeToolCall, initializeAlpacaTools } from './llm-tools';
import { AlpacaClient } from './alpacaClient';

const OPENAI_DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Define the system prompt for the chat service
const SYSTEM_PROMPT = `
You are a helpful trading assistant. You can help users with:
1. Looking up stock information and prices using Polygon.io data
2. Understanding their account status and positions using Alpaca data
3. Analyzing trading data and providing insights

When responding:
1. Always use the available tools to get real data
2. Be concise and clear in your explanations
3. If you need to calculate something, show your work
4. If you're unsure about something, say so
5. If you need more information, ask for it

Available tools:
- Alpaca tools for account, positions, orders, and portfolio data
- Polygon tools for market data, stock information, and price history
`;

interface ChatResponse {
  message: string;
  data?: any;
}

export class ChatService {
  private alpaca: AlpacaClient;
  private tools: Tool[];
  private systemPrompt: string;

  constructor(alpaca: AlpacaClient) {
    this.alpaca = alpaca;
    this.systemPrompt = SYSTEM_PROMPT;
    this.tools = allTools;
    initializeAlpacaTools(alpaca);
  }

  async processMessage(message: string): Promise<ChatResponse> {
    try {
      console.log('Processing message:', message);
      // Call the LLM with the user's message and our tools
      const llmResponse = await lumic.llm.call(
        message,
        'text',
        {
          model: OPENAI_DEFAULT_MODEL,
          developerPrompt: this.systemPrompt,
          tools: this.tools,
          temperature: 0.7
        }
      );

      console.log('LLM Response:', JSON.stringify(llmResponse, null, 2));

      // If there's no tool calls, return the direct response
      if (!llmResponse.tool_calls || llmResponse.tool_calls.length === 0) {
        return {
          message: llmResponse.response || 'No response generated',
          data: null
        };
      }

      // Execute tool calls and get results
      console.log('Tool calls requested:', llmResponse.tool_calls.map(tc => ({
        name: tc.function.name,
        args: tc.function.arguments
      })));

      const toolResults = await executeToolCall(llmResponse.tool_calls);
      console.log('Tool call results:', JSON.stringify(toolResults, null, 2));

      // Make a second LLM call to interpret the tool results
      const finalResponse = await lumic.llm.call(
        `Based on the user's question: "${message}", here are the results from the tools: ${JSON.stringify(toolResults)}. Please provide a clear and concise response.`,
        'text',
        {
          model: OPENAI_DEFAULT_MODEL,
          developerPrompt: this.systemPrompt,
          temperature: 0.7
        }
      );

      console.log('Follow-up response:', JSON.stringify(finalResponse, null, 2));

      return {
        message: finalResponse.response || 'No response generated',
        data: toolResults
      };
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }
}
