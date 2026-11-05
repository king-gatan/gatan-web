'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Boardgame {
  id: number;
  name?: string;
  title?: string;
  [key: string]: any;
}

export default function Home() {
  const [games, setGames] = useState<Boardgame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      // boardgame_collection 테이블에서 전체 목록 조회
      const { data, error } = await supabase
        .from('boardgame_collection')
        .select('*');

      if (error) {
        console.error('데이터 조회 오류:', error);
      } else {
        setGames(data || []);
      }
      setLoading(false);
    }

    fetchGames();
  }, []);

  if (loading) {
    return <main className="p-8 text-center">보드게임 목록을 불러오는 중입니다...</main>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🎲 모임 보드게임 목록</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game, idx) => (
          <div key={game.id || idx} className="border rounded-lg p-4 shadow-sm bg-white">
            <h2 className="text-lg font-semibold">{game.name || game.title || `게임 #${game.id}`}</h2>
            <pre className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(game, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}