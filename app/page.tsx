'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Gamepad2, Receipt, Utensils, User } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type Account = { id: string; nickname: string };

export default function MainPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserNickname, setCurrentUserNickname] = useState<string>('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // 1. 초기 데이터 로드 (계정 목록 & 로그인 상태 유지)
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data: accData } = await supabase
        .from('boardgame_accounts')
        .select('id, nickname')
        .order('created_at');
      if (accData) setAccounts(accData);

      const savedUserId = localStorage.getItem('gatan_current_user');
      if (savedUserId) {
        setCurrentUserId(savedUserId);
        const match = accData?.find(a => a.id === savedUserId);
        if (match) setCurrentUserNickname(match.nickname);
      }
    };
    fetchAccounts();
  }, []);

  // 2. 하단 시계 업데이트 로직
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${now.getHours()}시 ${now.getMinutes()}분 ${now.getSeconds()}초`
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. 로그인(유저 선택) 처리
  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCurrentUserId(selectedId);
    
    if (selectedId) {
      localStorage.setItem('gatan_current_user', selectedId);
      const match = accounts.find(a => a.id === selectedId);
      if (match) setCurrentUserNickname(match.nickname);
    } else {
      localStorage.removeItem('gatan_current_user');
      setCurrentUserNickname('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col relative pb-20">
      {/* --- GATAN 타이틀 --- */}
      <header className="pt-20 pb-12 flex justify-center">
        <h1 className="text-[3.5rem] font-black tracking-widest text-[#0f172a]">
          GATAN
        </h1>
      </header>

      {/* --- 메인 2x2 카드 그리드 --- */}
      <main className="flex-1 flex justify-center items-start px-6">
        <div className="grid grid-cols-2 gap-6 max-w-[600px] w-full">
          
          <Link href="/schedule" className="group bg-white rounded-3xl p-10 flex flex-col items-center justify-center shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer aspect-square">
            <Calendar className="w-16 h-16 text-[#3b82f6] mb-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
            <span className="text-lg font-bold text-gray-800">일정</span>
          </Link>

          <Link href="/catalog" className="group bg-white rounded-3xl p-10 flex flex-col items-center justify-center shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer aspect-square">
            <Gamepad2 className="w-16 h-16 text-[#8b5cf6] mb-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
            <span className="text-lg font-bold text-gray-800">보드게임 카탈로그</span>
          </Link>

          <Link href="/expense" className="relative group bg-white rounded-3xl p-10 flex flex-col items-center justify-center shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer aspect-square">
            {/* 정산 갱신 배지 */}
            <div className="absolute -top-3 right-6 bg-[#ff3b30] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm z-10">
              정산 갱신
            </div>
            <Receipt className="w-16 h-16 text-[#ff9500] mb-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
            <span className="text-lg font-bold text-gray-800">정산</span>
          </Link>

          <Link href="/food" className="group bg-white rounded-3xl p-10 flex flex-col items-center justify-center shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer aspect-square">
            <Utensils className="w-16 h-16 text-[#34c759] mb-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
            <span className="text-lg font-bold text-gray-800">오늘 뭐먹</span>
          </Link>

        </div>
      </main>

      {/* --- 하단 고정 푸터(Footer) --- */}
      <footer className="fixed bottom-0 w-full bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-4 flex justify-between items-center z-40">
        <div className="text-[13px] text-gray-600 font-medium">
          {currentUserId 
            ? `안녕하세요, ${currentUserNickname}님! 오늘 날짜는 ${currentTime} 입니다.`
            : `로그인을 진행해 주세요. 오늘 날짜는 ${currentTime} 입니다.`
          }
        </div>
        
        <button 
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-2 bg-[#1c1c1e] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-black transition-colors"
        >
          <User className="w-4 h-4" />
          {currentUserId ? '사용자 변경' : '로그인'}
        </button>
      </footer>

      {/* --- 로그인 선택 팝업 (모달) --- */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-[320px]">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">GATAN 접속하기</h3>
            <select
              value={currentUserId}
              onChange={handleUserSelect}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-6"
            >
              <option value="">-- 나를 선택하세요 --</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.nickname}</option>
              ))}
            </select>
            <button 
              onClick={() => setIsLoginModalOpen(false)}
              className="w-full bg-[#1c1c1e] text-white font-bold py-3 rounded-lg hover:bg-black transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}