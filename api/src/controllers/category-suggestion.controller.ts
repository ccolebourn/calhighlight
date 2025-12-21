import { Request, Response } from 'express';
import { CategorySuggestionService } from '../services/category-suggestion.service';

export class CategorySuggestionController {
  private categorySuggestionService: CategorySuggestionService;

  constructor() {
    this.categorySuggestionService = new CategorySuggestionService();
  }

  /**
   * POST /api/calendar/suggest-categories
   * Suggest categories based on calendar data with iterative refinement
   *
   * Body: {
   *   message?: string,
   *   conversationHistory?: CategoryConversationMessage[]
   * }
   *
   * Header: Authorization: Bearer <access_token>
   */
  suggestCategories = async (req: Request, res: Response): Promise<void> => {
    console.log('=== Category Suggestion Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    try {
      const { message, conversationHistory } = req.body;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      // Validation: Access token required
      if (!accessToken) {
        res.status(401).json({
          success: false,
          error: 'Access token is required. Include it in Authorization header as: Bearer <token>'
        });
        return;
      }

      // Validation: conversationHistory must be array if provided
      if (conversationHistory !== undefined && !Array.isArray(conversationHistory)) {
        res.status(400).json({
          success: false,
          error: 'conversationHistory must be an array',
          example: {
            message: 'I want more specific categories',
            conversationHistory: []
          }
        });
        return;
      }

      console.log('Processing category suggestion request');
      console.log('Message present:', !!message);
      console.log('History length:', conversationHistory?.length || 0);

      const response = await this.categorySuggestionService.suggestCategories(
        message,
        accessToken,
        conversationHistory || []
      );

      res.json(response);
    } catch (error) {
      console.error('Category suggestion error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate category suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * POST /api/calendar/categorize-events
   * Categorize events based on provided categories
   *
   * Body: {
   *   categories: Category[],
   *   startDate: string (YYYY-MM-DD),
   *   endDate: string (YYYY-MM-DD)
   * }
   *
   * Header: Authorization: Bearer <access_token>
   */
  categorizeEvents = async (req: Request, res: Response): Promise<void> => {
    console.log('=== Categorize Events Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    try {
      const { categories, startDate, endDate } = req.body;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      // Validation: Access token required
      if (!accessToken) {
        res.status(401).json({
          success: false,
          error: 'Access token is required. Include it in Authorization header as: Bearer <token>'
        });
        return;
      }

      // Validation: categories required
      if (!categories || !Array.isArray(categories) || categories.length === 0) {
        res.status(400).json({
          success: false,
          error: 'categories is required and must be a non-empty array',
          example: {
            categories: [
              { name: 'Work Meetings', colorId: '1', description: 'Work-related meetings' }
            ],
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          }
        });
        return;
      }

      // Validation: startDate and endDate required
      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate are required (format: YYYY-MM-DD)',
          example: {
            categories: [{ name: 'Work', colorId: '1', description: 'Work events' }],
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          }
        });
        return;
      }

      console.log('Processing event categorization request');
      console.log('Categories:', categories.length);
      console.log('Date range:', startDate, 'to', endDate);

      // Parse dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
        return;
      }

      const response = await this.categorySuggestionService.categorizeEvents(
        categories,
        start,
        end,
        accessToken
      );

      res.json(response);
    } catch (error) {
      console.error('Event categorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to categorize events',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
