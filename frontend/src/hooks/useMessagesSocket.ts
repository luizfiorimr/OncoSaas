'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { Message } from '@/lib/api/messages';

/**
 * Hook para escutar atualizações de mensagens em tempo real via WebSocket
 *
 * @param patientId - ID do paciente para escutar mensagens específicas
 */
export const useMessagesSocket = (patientId?: string) => {
  const { socket, isConnected } = useSocket('/messages');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected || !patientId) return;

    // Inscrever-se para receber mensagens do paciente específico
    socket.emit('subscribe_patient_messages', { patientId });

    // Escutar novos eventos de mensagem
    const handleNewMessage = (message: Message) => {
      // Só processar se a mensagem é do paciente correto
      if (message.patientId !== patientId) return;

      // Atualizar cache do React Query
      queryClient.setQueryData<Message[]>(['messages', patientId], (old) => {
        if (!old) return [message];

        // Evitar duplicatas (verificar se mensagem já existe)
        if (
          old.some(
            (m) =>
              m.id === message.id ||
              m.whatsappMessageId === message.whatsappMessageId
          )
        ) {
          return old;
        }

        // Adicionar nova mensagem e ordenar por timestamp
        return [...old, message].sort(
          (a, b) =>
            new Date(a.whatsappTimestamp).getTime() -
            new Date(b.whatsappTimestamp).getTime()
        );
      });

      // Invalidar contador de mensagens não assumidas
      queryClient.invalidateQueries({
        queryKey: ['messages', 'unassumed', 'count'],
      });
    };

    // Escutar quando mensagem é atualizada (assumida, enviada, etc.)
    const handleMessageUpdate = (message: Message) => {
      // Só processar se a mensagem é do paciente correto
      if (message.patientId !== patientId) return;

      // Atualizar mensagem específica no cache
      queryClient.setQueryData<Message[]>(['messages', patientId], (old) => {
        if (!old) return [message];
        return old.map((msg) =>
          msg.id === message.id ||
          msg.whatsappMessageId === message.whatsappMessageId
            ? message
            : msg
        );
      });

      // Invalidar contador
      queryClient.invalidateQueries({
        queryKey: ['messages', 'unassumed', 'count'],
      });
    };

    // Escutar quando mensagem é enviada (confirmação)
    const handleMessageSent = (message: Message) => {
      // Só processar se a mensagem é do paciente correto
      if (message.patientId !== patientId) return;

      // Atualizar mensagem temporária com dados reais do servidor
      queryClient.setQueryData<Message[]>(['messages', patientId], (old) => {
        if (!old) return [message];
        return old.map((msg) =>
          msg.id.startsWith('temp-') && msg.content === message.content
            ? message
            : msg
        );
      });
    };

    // Registrar listeners
    socket.on('new_message', handleNewMessage);
    socket.on('message_updated', handleMessageUpdate);
    socket.on('message_sent', handleMessageSent);

    // Cleanup: remover listeners e cancelar inscrição
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_updated', handleMessageUpdate);
      socket.off('message_sent', handleMessageSent);
      socket.emit('unsubscribe_patient_messages', { patientId });
    };
  }, [socket, isConnected, patientId, queryClient]);

  return {
    isConnected,
  };
};
