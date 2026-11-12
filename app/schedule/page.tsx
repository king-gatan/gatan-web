'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

// 임시 모의 데이터 (DB 연동 시 Supabase에서 gatan_plan_rsvp 데이터를 불러와 덮어씌움)
const MOCK_USERS = ['Tom', 'Jay', 'Ray'];
const MOCK_RSVP = {
  '2026-11-07': { Tom: 'O', Jay: 'X', Ray: 'O' }, // 2인
  '2026-11-08': { Tom: 'O', Jay: 'O', Ray: 'X' }, // 2인
  '2026-11-14': { Tom: 'O', Jay: 'O', Ray: 'O' }, // 3인
  '2026-11-15': { Tom: 'X', Jay: 'X', Ray: 'X' }, // X
  '2026-11-17': { Tom: 'O', Jay: 'O', Ray: 'O', isSpecial: true }, // 3인 (S)
};

const MOCK_LINEUP = {
  '2026-11-07': ['반지의 제왕 카드게임', '테이크 타임'],
};

export default function SchedulePage() {
  // 현재 달력 기준 상태 (기본값: 2026년 11월)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 1)); 
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-based

  // 달력 계산 (해당 월의 일수 및 시작 요일)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // 달 이동 핸들러
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // 날짜별 인원 계산 로직
  const getDayStatus = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const rsvp = MOCK_RSVP[dateKey as keyof typeof MOCK_RSVP];
    if (!rsvp) return null;
    
    let count = 0;
    if (rsvp.Tom === 'O') count++;
    if (rsvp.Jay === 'O') count++;
    if (rsvp.Ray === 'O') count++;

    if (count === 3) return '3인';
    if (count > 0) return `${count}인`;
    return 'X';
  };

  // 테이블 헤더용 날짜 추출
  const tableDates = Object.keys(MOCK_RSVP).sort();

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 pb-24">
      {/* 상단 네비게이션 */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-10">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
          <Home className="w-5 h-5" /> 메인으로
        </Link>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-wider">일정</h1>
        <div className="w-20" /> {/* 우측 여백 맞춤용 */}
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 좌측: 달력 영역 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 달력 헤더 */}
          <div className="bg-slate-800 text-white flex justify-between items-center p-4">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-700 rounded"><ChevronLeft /></button>
            <h2 className="text-xl font-bold">{month + 1}월</h2>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-700 rounded"><ChevronRight /></button>
          </div>
          
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 text-center py-3 bg-slate-50 border-b border-gray-100 font-semibold text-sm">
            <div className="text-red-500">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-blue-500">토</div>
          </div>
          
          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {blanks.map(b => <div key={`blank-${b}`} className="bg-white min-h-[80px]" />)}
            {daysArray.map(day => {
              const status = getDayStatus(day);
              return (
                <div key={day} className="bg-white min-h-[80px] p-2 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-gray-700">{day}</span>
                  {status && (
                    <div className={`text-center text-sm font-bold py-1 rounded ${status === '3인' ? 'bg-indigo-100 text-indigo-700' : status === 'X' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                      {status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 우측: 참석 여부 테이블 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr>
                <th className="p-3 border-b-2 border-slate-800 text-slate-800">이름</th>
                {tableDates.map(date => {
                  const d = new Date(date);
                  const isSpecial = (MOCK_RSVP as any)[date]?.isSpecial;
                  return (
                    <th key={date} className={`p-3 border-b-2 border-slate-800 text-white whitespace-nowrap ${isSpecial ? 'bg-indigo-600' : 'bg-slate-700'} border-r border-slate-600 last:border-r-0`}>
                      {d.getMonth() + 1}/{d.getDate()} ({['일','월','화','수','목','금','토'][d.getDay()]}){isSpecial ? '(S)' : ''}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map(user => (
                <tr key={user} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="p-3 font-semibold text-gray-700 bg-slate-50">{user}</td>
                  {tableDates.map(date => {
                    const rsvp = (MOCK_RSVP as any)[date];
                    const val = rsvp[user];
                    return (
                      <td key={`${user}-${date}`} className="p-3">
                        <select 
                          defaultValue={val}
                          className={`w-full p-1 border rounded font-bold outline-none cursor-pointer ${val === 'O' ? 'text-blue-600 border-blue-200 bg-blue-50' : val === 'X' ? 'text-red-600 border-red-200 bg-red-50' : 'text-gray-400'}`}
                        >
                          <option value="O">O</option>
                          <option value="X">X</option>
                          <option value="">-</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* 하단: 라인업 및 위시리스트 */}
      <section className="max-w-6xl mx-auto mt-8 flex flex-col md:flex-row gap-6">
        {/* Play Wish List 툴팁 버튼 */}
        <div className="relative group shrink-0">
          <button className="px-6 py-4 bg-white border-2 border-slate-800 text-slate-800 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            Play_wish_List
          </button>
          {/* Hover 툴팁 내용 */}
          <div className="absolute bottom-full left-0 mb-3 w-64 p-4 bg-gray-900 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <div className="font-bold mb-2">11/7 (토) 위시리스트</div>
            <ul className="list-disc list-inside text-gray-300">
              <li>아그리콜라 (Tom)</li>
              <li>테라포밍 마스 (Jay)</li>
            </ul>
            <div className="absolute -bottom-2 left-8 w-4 h-4 bg-gray-900 transform rotate-45"></div>
          </div>
        </div>

        {/* 라인업 텍스트 */}
        <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <span className="font-bold text-gray-800 mr-4 shrink-0">11/7 (토) 라인업 :</span>
          <div className="flex flex-wrap gap-2">
            {MOCK_LINEUP['2026-11-07'].map((game, idx) => (
              <div key={idx} className="relative group cursor-pointer text-indigo-600 hover:text-indigo-800 hover:underline font-medium px-2 border-r last:border-0 border-gray-300">
                {game}
                {/* 게임 호버 시 카탈로그 간략 정보 툴팁 */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                  <div className="text-xs text-gray-500 mb-1">베스트 3인 / 웨이트 2.4</div>
                  <div className="text-gray-800 font-bold text-sm">로컬 DB 참조 예시</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}