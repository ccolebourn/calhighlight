import { Request, Response } from 'express';
import { LangChainService } from '../services/langchain.service';

export class ChatController {
  private langchainService: LangChainService;

  constructor() {
    this.langchainService = new LangChainService();
  }

  /**
   * POST /api/chat
   * Chat with LangChain agent that can access calendar
   * Body: { message: string, conversationHistory?: array }
   * Header: Authorization: Bearer <access_token>
   */
  chat = async (req: Request, res: Response): Promise<void> => {
    console.log('=== Chat Request ===');
    console.log('Request body:', req.body);

    try {
      const { message, conversationHistory } = req.body;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!accessToken) {
        res.status(401).json({
          success: false,
          error: 'Access token is required. Include it in Authorization header as: Bearer <token>'
        });
        return;
      }

      if (!message || typeof message !== 'string') {
        res.status(400).json({
          success: false,
          error: 'message is required in request body',
          example: {
            message: 'What do I have on my calendar today?',
            conversationHistory: []
          }
        });
        return;
      }

      console.log('Processing chat message:', message);

      const response = await this.langchainService.chat(
        message,
        accessToken,
        conversationHistory || []
      );

      res.json({
        success: true,
        response,
        message: 'Chat response generated successfully'
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
