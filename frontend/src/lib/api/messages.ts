import { apiClient } from './client';

export interface Message {
  id: string;
  tenantId: string;
  patientId: string;
  conversationId: string | null;
  whatsappMessageId: string;
  whatsappTimestamp: string;
  type: 'TEXT' | 'AUDIO' | 'IMAGE' | 'DOCUMENT';
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  audioUrl: string | null;
  audioDuration: number | null;
  transcribedText: string | null;
  processedBy: 'AGENT' | 'NURSING';
  structuredData: Record<string, unknown> | null;
  criticalSymptomsDetected: string[];
  alertTriggered: boolean;
  assumedBy: string | null;
  assumedAt: string | null;
  createdAt: string;
  patient?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface MessageCount {
  count: number;
}

export interface SendMessageDto {
  patientId: string;
  content: string;
  conversationId?: string;
}

export const messagesApi = {
  async getAll(patientId?: string): Promise<Message[]> {
    const url = patientId ? `/messages?patientId=${patientId}` : '/messages';
    return apiClient.get<Message[]>(url);
  },

  async getById(id: string): Promise<Message> {
    return apiClient.get<Message>(`/messages/${id}`);
  },

  async getUnassumedCount(): Promise<MessageCount> {
    return apiClient.get<MessageCount>('/messages/unassumed/count');
  },

  async assume(id: string): Promise<Message> {
    return apiClient.patch<Message>(`/messages/${id}/assume`, {});
  },

  async send(data: SendMessageDto): Promise<Message> {
    // Gerar IDs únicos para WhatsApp (simulado, em produção viria do WhatsApp API)
    const whatsappMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const whatsappTimestamp = new Date().toISOString();

    return apiClient.post<Message>('/messages', {
      patientId: data.patientId,
      conversationId: data.conversationId,
      whatsappMessageId,
      whatsappTimestamp,
      type: 'TEXT',
      direction: 'OUTBOUND',
      content: data.content,
      processedBy: 'NURSING',
    });
  },
};
