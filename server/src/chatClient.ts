import { lumic, Tool, LLMResponse } from 'lumic-utility-functions';
import { allTools, executeToolCall, initializeAlpacaTools } from './llm-tools';
import { AlpacaClient } from './alpacaClient';
import { adaptic as adptc} from 'adaptic-utils';
import { 
  ChatCompletionMessageParam, 
  ChatCompletionFunctionMessageParam, 
  ChatCompletionUserMessageParam, 
  ChatCompletionAssistantMessageParam, 
  ChatCompletionSystemMessageParam 
} from 'openai/resources/chat/completions';

const OPENAI_DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

interface ChatResponse {
  message: string;
  data?: any;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    model: string;
    cost: number;
  };
}

// Define the system prompt for the chat service
const SYSTEM_PROMPT = async (marketStatus: string ) => `
You are a helpful trading assistant. You can help users with:
1. Looking up the latest stock information and prices using Polygon.io data
2. Understanding their account status and positions using Alpaca data
3. Analyzing trading data and providing insights
4. Executing trades and managing orders through Alpaca
5. Managing positions and portfolio

Current market time and status: ${marketStatus}

When responding:
1. Always use the available tools to get real, up-to-date data, bearing in mind today's date
2. Be concise and clear in your explanations
3. Format responses so they're easy to read in pure text with no markdown or HTML
4. If you need to calculate something, show your work
5. If you're unsure about something, say so
6. If you need more information, ask for it

Available tools:
- Alpaca tools for account, positions, orders, portfolio data, and trade execution
- Polygon tools for market data, stock information, and price history

For trade execution, you can:
1. Create new orders (market, limit, stop, etc.)
2. Cancel existing orders
3. Close positions
4. Modify existing orders
`;

export class ChatService {
  private alpaca: AlpacaClient;
  private tools: Tool[];
  private systemPrompt: string;
  private messages: (ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam | ChatCompletionSystemMessageParam | ChatCompletionFunctionMessageParam)[] = [];

  private constructor(alpaca: AlpacaClient, systemPrompt: string) {
    this.alpaca = alpaca;
    this.systemPrompt = systemPrompt;
    this.tools = allTools;
    this.messages = [{ role: 'system', content: systemPrompt }];
    initializeAlpacaTools(alpaca);
  }

  public static async initialize(alpaca: AlpacaClient): Promise<ChatService> {
    const marketStatus = await adptc.time.getMarketStatus();
    const systemPrompt = await SYSTEM_PROMPT(`Today's date is ${marketStatus.timeString} and the market is currently ${marketStatus.status.toUpperCase()}. The next status is ${marketStatus.nextStatus.toUpperCase()} at ${marketStatus.nextStatusTimeString}.`);
    return new ChatService(alpaca, systemPrompt);
  }

  public reset(): void {
    console.log('Resetting chat history');
    this.messages = [{ role: 'system', content: this.systemPrompt }];
  }

  async processMessage(message: string): Promise<ChatResponse> {
    try {
      console.log('Processing message:', message);
      console.log('Current message history:', JSON.stringify(this.messages, null, 2));
      
      // Add user message to history
      this.messages.push({ role: 'user', content: message });

      // Call the LLM with the user's message, message history, and our tools
      const llmResponse = await lumic.llm.call(
        message,
        'text',
        {
          model: OPENAI_DEFAULT_MODEL,
          tools: this.tools,
          temperature: 0.7,
          context: this.messages
        }
      );

      console.log('LLM Response:', JSON.stringify(llmResponse, null, 2));

      // If there's no tool calls, add response to history and return
      if (!llmResponse.tool_calls || llmResponse.tool_calls.length === 0) {
        const response = llmResponse.response || 'No response generated';
        this.messages.push({ role: 'assistant', content: response });
        return {
          message: response,
          data: null,
          usage: {
            prompt_tokens: llmResponse.usage.prompt_tokens,
            completion_tokens: llmResponse.usage.completion_tokens,
            model: llmResponse.usage.model,
            cost: llmResponse.usage.cost
          }
        };
      }

      // Execute tool calls and get results
      console.log('Tool calls requested:', llmResponse.tool_calls.map(tc => ({
        name: tc.function.name,
        args: tc.function.arguments
      })));

      const toolResults = await executeToolCall(llmResponse.tool_calls);
      console.log('Tool call results:', JSON.stringify(toolResults, null, 2));

      // Add assistant's function calls to the conversation history
      const functionCallsText = llmResponse.tool_calls
        .map(tc => `Function ${tc.function.name}(${tc.function.arguments})`)
        .join('\n');
      this.messages.push({ 
        role: 'assistant', 
        content: `I'm checking that information for you.\n${functionCallsText}`
      });

      // Add function results to the conversation history
      this.messages.push({ 
        role: 'function', 
        content: JSON.stringify(toolResults),
        name: 'tool_results'
      } as ChatCompletionFunctionMessageParam);

      // Make a second LLM call to interpret the tool results
      const finalResponse = await lumic.llm.call(
        'Based on the tool results and previous conversation, please provide a clear and concise response.',
        'text',
        {
          model: OPENAI_DEFAULT_MODEL,
          temperature: 0.7,
          context: this.messages
        }
      );

      // Add assistant response to history
      const response = finalResponse.response || 'No response generated';
      this.messages.push({ role: 'assistant', content: response });

      // Calculate total usage from both calls
      const totalUsage = {
        prompt_tokens: llmResponse.usage.prompt_tokens + finalResponse.usage.prompt_tokens,
        completion_tokens: llmResponse.usage.completion_tokens + finalResponse.usage.completion_tokens,
        model: finalResponse.usage.model,
        cost: llmResponse.usage.cost + finalResponse.usage.cost
      };

      return {
        message: response,
        data: toolResults,
        usage: totalUsage
      };
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }
}
