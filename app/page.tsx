'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type Account = {
  id: string;
  nickname: string;
};

export default function MainPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. 초기 로드 시 DB에서 유저 목록을 가져오고, 기존 로그인 정보가 있는지 확인
  useEffect(() => {
    const fetchAccounts = async () => {
      // Supabase에서 계정 목록 가져오기
      const { data: accData, error } = await supabase
        .from('boardgame_accounts')
        .select('id, nickname')
        .order('created_at'); // 가입(생성) 순 정렬

      if (error) {
        console.error("계정 목록 로드 실패:", error);
      } else if (accData) {
        setAccounts(accData);
      }

      // 브라우저 로컬 스토리지에서 이전에 선택했던 유저 ID 꺼내기
      const savedUserId = localStorage.getItem('gatan_current_user');
      if (savedUserId) {
        setCurrentUserId(savedUserId);
      }
      
      setIsLoading(false);
    };

    fetchAccounts();
  }, []);

  // 2. 유저 선택(로그인) 변경 핸들러
  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCurrentUserId(selectedId);

    // 선택한 ID를 로컬 스토리지에 저장 (정산/평가 페이지에서 이 키를 그대로 꺼내 씁니다)
    if (selectedId) {
      localStorage.setItem('gatan_current_user', selectedId);
    } else {
      // '선택 안 함'으로 돌렸을 경우 스토리지에서 삭제
      localStorage.removeItem('gatan_current_user');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      {/* --- 헤더 및 유저 선택 영역 --- */}
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-12">
        <h1 className="text-3xl font-extrabold text-indigo-900">DICE CLUB NIGHT</h1>
        
        {/* 실제 DB와 연동된 로그인(유저 선택) 드롭다운 */}
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600">👤 내 정보:</span>
          {isLoading ? (
            <span className="text-sm text-gray-400">로딩 중...</span>
          ) : (
            <select
              value={currentUserId}
              onChange={handleUserSelect}
              className="border-b-2 border-indigo-500 bg-transparent text-sm font-bold text-indigo-700 outline-none cursor-pointer focus:border-indigo-700 transition-colors"
            >
              <option value="" className="text-gray-400">-- 나를 선택하세요 --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nickname}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* --- 메인 메뉴(네비게이션) 영역 예시 --- */}
      <section className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 일정 페이지로 이동 */}
        <Link href="/schedule" className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all group">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600">📅 일정 및 라인업</h2>
          <p className="text-gray-500">다가오는 모임 일정과 확정된 보드게임 라인업을 확인하세요.</p>
        </Link>

        {/* 방금 만든 정산 페이지로 이동 */}
        <Link href="/expense" className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all group">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600">🧾 정산 및 평가</h2>
          <p className="text-gray-500">최근 모임의 회비 정산 내역과 오늘 플레이한 게임의 별점을 남겨주세요.</p>
        </Link>
      </section>
    </main>
  );
}