'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Receipt, Utensils, Gamepad2, LogOut, User } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showLoginMenu, setShowLoginMenu] = useState(false);

  const members = ['Tom', 'Jay', 'Ray'];

  // 1초마다 현재 시간 업데이트
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 목요일(4) 0:00 ~ 금요일(5) 23:59 뱃지 표시 로직
  const isPlanUpdateDay = currentTime 
    ? (currentTime.getDay() === 4 || currentTime.getDay() === 5) 
    : false;

  // 임시: DB 연동 전까지 정산 갱신 뱃지를 띄울지 결정하는 변수
  const isExpenseUpdateNeeded = true; 

  const formattedTime = currentTime 
    ? `${currentTime.getFullYear()}년 ${currentTime.getMonth() + 1}월 ${currentTime.getDate()}일 ${currentTime.getHours()}시 ${currentTime.getMinutes()}분 ${currentTime.getSeconds()}초` 
    : '시간을 불러오는 중...';

  // 메인 메뉴 버튼 데이터
  const menuItems = [
    {
      title: '일정',
      href: '/schedule',
      icon: <Calendar className="w-16 h-16 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />,
      badge: isPlanUpdateDay ? '지금 갱신' : null,
    },
    {
      title: '보드게임 카탈로그',
      href: '/catalog',
      icon: <Gamepad2 className="w-16 h-16 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />,
      badge: null,
    },
    {
      title: '정산',
      href: '/expense',
      icon: <Receipt className="w-16 h-16 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />,
      badge: isExpenseUpdateNeeded ? '정산 갱신' : null,
    },
    {
      title: '오늘 뭐먹',
      href: '/food',
      icon: <Utensils className="w-16 h-16 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />,
      badge: null,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col relative pb-20">
      {/* 헤더 */}
      <header className="pt-16 pb-8 text-center">
        <h1 className="text-6xl font-extrabold text-gray-900 tracking-widest">GATAN</h1>
      </header>

      {/* 메인 메뉴 그리드 */}
      <section className="flex-1 flex items-center justify-center px-4">
        <div className="grid grid-cols-2 gap-6 max-w-2xl w-full">
          {menuItems.map((item, idx) => (
            <Link key={idx} href={item.href} className="block relative group">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 aspect-square flex flex-col items-center justify-center p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                {/* 갱신 뱃지 */}
                {item.badge && (
                  <div className="absolute -top-3 -right-3 bg-red-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg animate-bounce">
                    {item.badge}
                  </div>
                )}
                {item.icon}
                <span className="text-xl font-semibold text-gray-700">{item.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 하단 정보 바 */}
      <footer className="absolute bottom-0 w-full bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="text-gray-600 text-sm">
          {currentUser ? (
            <p><span className="font-bold text-gray-900">{currentUser}</span>님 오신 것을 환영합니다. 오늘 날짜는 {formattedTime} 입니다.</p>
          ) : (
            <p>로그인을 진행해 주세요. 오늘 날짜는 {formattedTime} 입니다.</p>
          )}
        </div>

        {/* 로그인/로그아웃 버튼 및 드롭다운 */}
        <div className="relative">
          <button 
            onClick={() => setShowLoginMenu(!showLoginMenu)}
            className="flex items-center gap-2 bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {currentUser ? (
              <><LogOut className="w-4 h-4" /> 로그아웃</>
            ) : (
              <><User className="w-4 h-4" /> 로그인</>
            )}
          </button>

          {/* 모임원 선택 드롭다운 */}
          {showLoginMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
              {currentUser ? (
                <button 
                  onClick={() => { setCurrentUser(null); setShowLoginMenu(false); }}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 font-medium"
                >
                  로그아웃 하기
                </button>
              ) : (
                members.map(member => (
                  <button
                    key={member}
                    onClick={() => { setCurrentUser(member); setShowLoginMenu(false); }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-b last:border-0 font-medium"
                  >
                    {member}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}