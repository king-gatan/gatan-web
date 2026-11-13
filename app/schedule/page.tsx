'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 유틸리티 함수 ---
const chunkArray = (arr: any[], size: number) => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );
};

const getTodayString = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// --- RSVP 상태 업데이트용 개별 Select 컴포넌트 ---
const RsvpSelect = ({ 
  planId, 
  accountId, 
  initialValue, 
  onStatusChange 
}: { 
  planId: string; 
  accountId: string; 
  initialValue: string;
  onStatusChange: (newStatus: string) => void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const value = initialValue || 'PENDING';

  let colorClass = '';
  if (value === 'O') colorClass = 'text-blue-600 border-blue-200 bg-blue-50';
  else if (value === 'X') colorClass = 'text-red-600 border-red-200 bg-red-50';
  else colorClass = 'text-emerald-600 border-emerald-200 bg-emerald-50';

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setIsUpdating(true);

    const { error } = await supabase
      .from('gatan_plan_rsvp')
      .upsert(
        { plan_id: planId, account_id: accountId, attend_status: newValue },
        { onConflict: 'plan_id, account_id' }
      );

    setIsUpdating(false);

    if (error) {
      console.error('RSVP 업데이트 에러:', error);
      alert('상태 업데이트에 실패했습니다.');
    } else {
      onStatusChange(newValue);
    }
  };

  return (
    <select 
      value={value}
      onChange={handleChange}
      disabled={isUpdating}
      className={`w-full p-1 border rounded font-bold text-center outline-none cursor-pointer text-sm transition-colors ${colorClass} ${isUpdating ? 'opacity-50' : ''}`}
    >
      <option value="PENDING">-</option>
      <option value="O">O</option>
      <option value="X">X</option>
    </select>
  );
};

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [isLoading, setIsLoading] = useState(true);

  // DB 연동 상태 변수들
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<Record<string, any>>({});
  const [rsvps, setRsvps] = useState<Record<string, Record<string, string>>>({});
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [boardgamesMap, setBoardgamesMap] = useState<Record<string, string>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { data: accountsData } = await supabase.from('boardgame_accounts').select('id, nickname').order('created_at');
      if (accountsData) setUsers(accountsData);

      const { data: gamesData } = await supabase.from('boardgame').select('id, title');
      const gMap: Record<string, string> = {};
      if (gamesData) {
        gamesData.forEach(g => gMap[g.id] = g.title);
        setBoardgamesMap(gMap);
      }

      const { data: planData } = await supabase.from('gatan_plan').select('*');
      const pMap: Record<string, any> = {};
      if (planData) planData.forEach(p => pMap[p.meeting_date] = p);
      setPlans(pMap);

      const { data: rsvpData } = await supabase.from('gatan_plan_rsvp').select('*, gatan_plan(meeting_date)');
      const rMap: Record<string, Record<string, string>> = {};
      if (rsvpData) {
        rsvpData.forEach(r => {
          const date = r.gatan_plan?.meeting_date;
          if (date) {
            if (!rMap[date]) rMap[date] = {};
            rMap[date][r.account_id] = r.attend_status;
          }
        });
      }
      setRsvps(rMap);

      const { data: wishData } = await supabase
        .from('gatan_plan_wishlist')
        .select('*, boardgame(title), boardgame_accounts(nickname)')
        .eq('wish_status', 'ACTIVE');
      if (wishData) setWishlist(wishData);

      setIsLoading(false);
    };

    if (supabaseUrl && supabaseKey) fetchData();
    else setIsLoading(false);
  }, []);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDayStatus = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayRsvps = rsvps[dateKey];
    if (!dayRsvps) return null;
    
    let oCount = 0;
    let xCount = 0;
    Object.values(dayRsvps).forEach(status => {
      if (status === 'O') oCount++;
      if (status === 'X') xCount++;
    });

    if (oCount >= 3) return '3인';
    if (oCount === 2) return '2인';
    if (xCount > 0 && oCount === 0) return 'X';
    return null;
  };

  // --- 요구사항 1: 월별 데이터 동적 분할 및 빈칸 처리 ---
  // 현재 달력에 표시된 '월'과 일치하는 데이터만 필터링
  const currentMonthDates = Object.keys(plans)
    .filter(date => {
      const [y, m] = date.split('-');
      return parseInt(y) === year && parseInt(m) === month + 1;
    })
    .sort();

  const totalDates = currentMonthDates.length;
  // 10개 초과면 한 줄에 5개씩 (3줄 이상), 10개 이하면 절반으로 나눔 (홀수면 위가 1개 더 많음)
  const chunkSize = totalDates > 10 ? 5 : Math.ceil(totalDates / 2) || 1; 
  
  // 배열을 자른 뒤, 빈 공간을 null로 채워 넣어 테이블의 UI 규격을 일정하게 맞춤
  const rawChunks = totalDates > 0 ? chunkArray(currentMonthDates, chunkSize) : [];
  const paddedChunks = rawChunks.map(chunk => {
    const padCount = chunkSize - chunk.length;
    return padCount > 0 ? [...chunk, ...Array(padCount).fill(null)] : chunk;
  });

  // --- 요구사항 2: 다가오는 미래의 확정된 라인업 ---
  const todayStr = getTodayString();
  const upcomingConfirmedPlans = Object.values(plans)
    .filter(p => p.meeting_date >= todayStr && Array.isArray(p.line_up) && p.line_up.length > 0)
    .sort((a, b) => a.meeting_date.localeCompare(b.meeting_date));
  
  // 가장 가까운 미래 일정 1개 추출
  const nextConfirmedPlan = upcomingConfirmedPlans.length > 0 ? upcomingConfirmedPlans[0] : null;

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">데이터를 불러오는 중입니다...</div>;
  if (!supabaseUrl && users.length === 0) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500 p-8 text-center">환경변수 설정이 필요합니다.</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 pb-24">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-10">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
          <Home className="w-5 h-5" /> 메인으로
        </Link>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-wider">일정</h1>
        <div className="w-20" /> 
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* 달력 영역 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-slate-800 text-white flex justify-between items-center p-4">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-700 rounded"><ChevronLeft /></button>
            <h2 className="text-xl font-bold">{year}년 {month + 1}월</h2>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-700 rounded"><ChevronRight /></button>
          </div>
          <div className="grid grid-cols-7 text-center py-3 bg-slate-50 border-b border-gray-100 font-semibold text-sm">
            <div className="text-red-500">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-blue-500">토</div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {blanks.map(b => <div key={`blank-${b}`} className="bg-white min-h-[80px]" />)}
            {daysArray.map(day => {
              const status = getDayStatus(day);
              return (
                <div key={day} className="bg-white min-h-[80px] p-2 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-gray-700">{day}</span>
                  {status && (
                    <div className={`text-center text-sm font-bold py-1 rounded ${status === '3인' ? 'bg-blue-100 text-blue-700' : status === 'X' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                      {status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 참석 여부 테이블 영역 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
          {paddedChunks.map((chunk, chunkIdx) => (
            <table key={chunkIdx} className="w-full text-center border-collapse table-fixed">
              <thead>
                <tr>
                  <th className="p-2 border-b-2 border-slate-800 text-slate-800 w-16">이름</th>
                  {chunk.map((date, idx) => {
                    if (!date) return <th key={`empty-th-${chunkIdx}-${idx}`} className="p-2 border-b-2 border-slate-800 bg-slate-700 border-r border-slate-600 last:border-r-0"></th>;
                    const d = new Date(date);
                    return (
                      <th key={date} className="p-2 border-b-2 border-slate-800 text-white text-sm bg-slate-700 border-r border-slate-600 last:border-r-0">
                        {d.getMonth() + 1}/{d.getDate()} ({['일','월','화','수','목','금','토'][d.getDay()]})
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="p-2 font-semibold text-gray-700 bg-slate-50 border-r border-gray-100 text-sm">
                      {user.nickname}
                    </td>
                    {chunk.map((date, idx) => {
                      if (!date) return <td key={`empty-td-${chunkIdx}-${idx}`} className="p-1.5 bg-gray-50 border-r border-gray-100 last:border-r-0"></td>;
                      const planId = plans[date]?.id;
                      const val = rsvps[date]?.[user.id] || 'PENDING';
                      return (
                        <td key={`${user.id}-${date}`} className="p-1.5 border-r border-gray-100 last:border-r-0">
                          {planId ? (
                            <RsvpSelect 
                              planId={planId} accountId={user.id} initialValue={val}
                              onStatusChange={(newVal) => setRsvps(prev => ({ ...prev, [date]: { ...prev[date], [user.id]: newVal } }))}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">일정 없음</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
          {paddedChunks.length === 0 && (
            <div className="text-center text-gray-500 py-8 font-medium">이번 달에 등록된 일정이 없습니다.</div>
          )}
        </section>
      </div>

      <section className="max-w-6xl mx-auto mt-8 flex flex-col md:flex-row gap-6 items-start">
        {/* Play Wish List 툴팁 버튼 */}
        <div className="relative group shrink-0">
          <button className="px-6 py-4 bg-white border-2 border-slate-800 text-slate-800 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            Play_wish_List
          </button>
          <div className="absolute bottom-full left-0 mb-3 w-80 p-4 bg-gray-900 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <div className="font-bold mb-3 text-indigo-300">현재 등록된 위시리스트</div>
            <ul className="list-disc list-inside text-gray-200 space-y-1.5">
              {wishlist.length > 0 ? (
                wishlist.map(w => <li key={w.id}>{w.boardgame?.title} / {w.boardgame_accounts?.nickname} / {w.added_date}</li>)
              ) : (
                <li className="list-none text-gray-400 text-center">등록된 위시리스트가 없습니다.</li>
              )}
            </ul>
            <div className="absolute -bottom-2 left-8 w-4 h-4 bg-gray-900 transform rotate-45"></div>
          </div>
        </div>

        {/* 확정된 미래 라인업 영역 */}
        <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center flex-wrap gap-2">
          <span className="font-bold text-gray-800 mr-2 shrink-0">
            {nextConfirmedPlan ? `${nextConfirmedPlan.meeting_date} 라인업 :` : '미정 (확정된 일정 없음) :'}
          </span>
          
          {nextConfirmedPlan ? (
            nextConfirmedPlan.line_up.map((gameId: string, idx: number) => (
              <div key={idx} className="relative group cursor-pointer text-indigo-600 hover:text-indigo-800 hover:underline font-medium px-2 border-r last:border-0 border-gray-300">
                {boardgamesMap[gameId] || '알 수 없는 게임'}
              </div>
            ))
          ) : (
            <span className="text-gray-400 font-medium italic">
              아직 라인업이 확정된 다가오는 일정이 없습니다.
            </span>
          )}
        </div>
      </section>
    </main>
  );
}