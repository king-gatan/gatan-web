'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home, Send, Calculator } from 'lucide-react';

// 임시 모의 데이터 (DB 연동 시 gatan_plan_expenses 및 gatan_plan_rsvp 등에서 조인하여 가져옴)
const MOCK_EXPENSES = {
  '2026-11-06': [
    { name: 'Tom', lunch: 9000, cafe: 7000, drink: 5500, dinner: 15000, karaoke: 1000, pub: 0, discount: 0 },
    { name: 'Jay', lunch: 8000, cafe: 7000, drink: 4500, dinner: 15000, karaoke: 1000, pub: 0, discount: 2000 },
    { name: 'Ray', lunch: 7000, cafe: 7000, drink: 5500, dinner: 15000, karaoke: 1000, pub: 0, discount: 0 },
  ],
};

const MOCK_PLAYED_GAMES = {
  '2026-11-06': ['반지의 제왕 카드게임', '테이크 타임', '백로성'],
};

export default function ExpensePage() {
  // 현재 선택된 날짜 상태 (기본값: 2026년 11월 6일)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 6)); 
  
  // 평가(Rating) 폼 상태 관리
  const [ratings, setRatings] = useState<Record<string, string>>({});

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const displayDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
  
  const dailyExpenses = MOCK_EXPENSES[dateKey as keyof typeof MOCK_EXPENSES] || [];
  const playedGames = MOCK_PLAYED_GAMES[dateKey as keyof typeof MOCK_PLAYED_GAMES] || [];

  // 총합 계산 함수 (감액을 제외한 모든 값을 더하고, 감액을 뺌)
  const calculateTotal = (expense: any) => {
    const sum = (expense.lunch || 0) + (expense.cafe || 0) + (expense.drink || 0) + 
                (expense.dinner || 0) + (expense.karaoke || 0) + (expense.pub || 0);
    return sum - (expense.discount || 0);
  };

  const handleRatingChange = (game: string, value: string) => {
    setRatings(prev => ({ ...prev, [game]: value }));
  };

  const handleSubmitRatings = () => {
    alert('평가가 전송되었습니다! (DB 연동 시 boardgame_playlog_ratings에 INSERT 됨)');
    console.log('전송될 평가 데이터:', ratings);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 pb-24">
      {/* 상단 네비게이션 */}
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-10">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
          <Home className="w-5 h-5" /> 메인으로
        </Link>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-wider">정산</h1>
        <div className="w-20" /> 
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* 정산 테이블 영역 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 날짜 선택 헤더 */}
          <div className="bg-slate-800 text-white flex justify-between items-center p-4">
            <button onClick={handlePrevDay} className="p-1 hover:bg-slate-700 rounded transition-colors"><ChevronLeft /></button>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              날짜 : {displayDate}
            </h2>
            <button onClick={handleNextDay} className="p-1 hover:bg-slate-700 rounded transition-colors"><ChevronRight /></button>
          </div>

          {/* 비용 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-700 text-white text-sm">
                  <th className="p-3 border-r border-slate-600">이름</th>
                  <th className="p-3 border-r border-slate-600">점심</th>
                  <th className="p-3 border-r border-slate-600">카페</th>
                  <th className="p-3 border-r border-slate-600">음료</th>
                  <th className="p-3 border-r border-slate-600">저녁</th>
                  <th className="p-3 border-r border-slate-600">코노</th>
                  <th className="p-3 border-r border-slate-600">술집</th>
                  <th className="p-3 border-r border-slate-600">감액</th>
                  <th className="p-3 bg-slate-800 font-bold text-orange-400">총합</th>
                </tr>
              </thead>
              <tbody>
                {dailyExpenses.length > 0 ? (
                  dailyExpenses.map((exp, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 text-gray-700">
                      <td className="p-3 font-bold bg-slate-50 border-r border-gray-100">{exp.name}</td>
                      <td className="p-3">{exp.lunch.toLocaleString()}</td>
                      <td className="p-3">{exp.cafe.toLocaleString()}</td>
                      <td className="p-3">{exp.drink.toLocaleString()}</td>
                      <td className="p-3">{exp.dinner.toLocaleString()}</td>
                      <td className="p-3">{exp.karaoke.toLocaleString()}</td>
                      <td className="p-3">{exp.pub.toLocaleString()}</td>
                      <td className="p-3 text-red-500">{exp.discount > 0 ? `-${exp.discount.toLocaleString()}` : '0'}</td>
                      <td className="p-3 font-extrabold text-slate-800 bg-orange-50/50">
                        {calculateTotal(exp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-gray-400">해당 날짜의 정산 내역이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 게임 평가 영역 */}
        {playedGames.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-slate-800 text-white flex justify-between items-center p-4">
              <h2 className="text-lg font-bold">오늘 플레이한 게임을 평가해 주세요</h2>
              <button 
                onClick={handleSubmitRatings}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                전송
              </button>
            </div>
            
            <div className="p-6 space-y-4 bg-slate-50/50">
              {playedGames.map((game, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-full md:w-1/2 font-bold text-gray-800 text-lg text-center md:text-left pl-2">
                    {game}
                  </div>
                  <div className="w-full md:w-1/2">
                    <select 
                      value={ratings[game] || ''}
                      onChange={(e) => handleRatingChange(game, e.target.value)}
                      className="w-full p-3 border-2 border-slate-200 rounded-lg font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer bg-slate-50 hover:bg-white"
                    >
                      <option value="" disabled>평가를 선택해 주세요</option>
                      <option value="5">5 - 할아버지의 이름을 걸고</option>
                      <option value="4">4 - 아주 재밌어요</option>
                      <option value="3">3 - 무난무난해요</option>
                      <option value="2">2 - 쿰쿰한 냄새가 나네요</option>
                      <option value="1">1 - 다시는 안 할래요</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}