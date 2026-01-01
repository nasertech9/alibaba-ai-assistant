
export type ToolType = 
  | 'listing_writer' 
  | 'title_optimizer' 
  | 'pricing_advisor' 
  | 'rfq_generator' 
  | 'market_research' 
  | 'communication' 
  | 'audit';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export interface AlibabaResponse {
  title?: string;
  category?: string;
  attributes?: Record<string, string>;
  description?: string;
  pricing?: string;
  keywords?: string[];
  tips?: string;
}
