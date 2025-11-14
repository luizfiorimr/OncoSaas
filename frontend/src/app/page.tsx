'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Aguardar inicialização completar antes de redirecionar
    if (!isInitializing) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isInitializing, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Plataforma de Otimização de Processos Oncológicos
        </h1>
        <p className="text-lg text-gray-600 mb-8">Carregando...</p>
        <Button onClick={() => router.push('/login')}>Ir para Login</Button>
      </div>
    </main>
  );
}
