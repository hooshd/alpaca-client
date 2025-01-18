import { lumic, Tool, LLMResponse } from 'lumic-utility-functions';
import { allTools, executeToolCall, initializeAlpacaTools } from './llm-tools';
import { AlpacaClient } from './alpacaClient';
import { adaptic as adptc} from 'adaptic-utils';

const OPENAI_DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';



// Define the system prompt for the chat service
const SYSTEM_PROMPT = async (marketStatus: string ) => `
You are a helpful trading assistant. You can help users with:
1. Looking up stock information and prices using Polygon.io data
2. Understanding their account status and positions using Alpaca data
3. Analyzing trading data and providing insights
4. Executing trades and managing orders through Alpaca
5. Managing positions and portfolio

Current date/time in New York and market status is: 
${marketStatus}

When responding:
1. Always use the available tools to get real, up-to-date data
2. Be concise and clear in your explanations
3. Format responses so they're easy to read
4. If you need to calculate something, show your work
5. If you're unsure about something, say so
6. If you need more information, ask for it
7. When placing trades, always verify account status and buying power first
8. Confirm order details before execution

Available tools:
- Alpaca tools for account, positions, orders, portfolio data, and trade execution
- Polygon tools for market data, stock information, and price history

For trade execution, you can:
1. Create new orders (market, limit, stop, etc.)
2. Cancel existing orders
3. Close positions
4. Modify existing orders
`;

interface ChatResponse {
  message: string;
  data?: any;
}

export class ChatService {
  private alpaca: AlpacaClient;
  private tools: Tool[];
  private systemPrompt: string;

  private constructor(alpaca: AlpacaClient, systemPrompt: string) {
    this.alpaca = alpaca;
    this.systemPrompt = systemPrompt;
    this.tools = allTools;
    initializeAlpacaTools(alpaca);
  }

  public static async initialize(alpaca: AlpacaClient): Promise<ChatService> {
    const marketStatus = await adptc.time.getMarketStatus();
    const systemPrompt = await SYSTEM_PROMPT(JSON.stringify(marketStatus));
    return new ChatService(alpaca, systemPrompt);
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
