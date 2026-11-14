//DB 연동 1차

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Star } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- 타입 정의 ---
type ExpenseSummary = {
  accountId: string;
  nickname: string;
  total: number;
  details: Record<string, number>;
};
type Playlog = {
  id: string;
  boardgame_id: string;
  boardgame: { title: string };
  myRating?: number;
};

export default function ReceiptPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  // 현재 접속자 상태
  const [currentAccountId, setCurrentAccountId] = useState<string>(''); 
  const [currentUserNickname, setCurrentUserNickname] = useState<string>(''); 
  
  const [targetDate, setTargetDate] = useState<string>('');
  const [targetPlanId, setTargetPlanId] = useState<string>('');
  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [playlogs, setPlaylogs] = useState<Playlog[]>([]);

  // 1. 초기 데이터 로드 (현재 로그인 유저 확인 & 최근 영수증 플랜)
  useEffect(() => {
    const fetchInitialData = async () => {
      // 메인 페이지에서 저장한 로그인 정보 불러오기
      // (주의: 메인 페이지에서 저장할 때 쓴 key 이름과 동일해야 합니다)
      const savedAccountId = localStorage.getItem('gatan_current_user');
      
      if (savedAccountId) {
        setCurrentAccountId(savedAccountId);
        // 현재 유저의 닉네임 가져오기 (헤더 표시용)
        const { data: userData } = await supabase
          .from('boardgame_accounts')
          .select('nickname')
          .eq('id', savedAccountId)
          .single();
        if (userData) setCurrentUserNickname(userData.nickname);
      }

      // gatan_plan에서 is_receipt_updated가 true인 가장 최근 일정 1개 가져오기
      const { data: planData } = await supabase
        .from('gatan_plan')
        .select('id, meeting_date')
        .eq('is_receipt_updated', true)
        .order('meeting_date', { ascending: false })
        .limit(1)
        .single();

      if (planData) {
        setTargetDate(planData.meeting_date);
        setTargetPlanId(planData.id);
      }
      setIsLoading(false);
    };

    fetchInitialData();
  }, []);

  // 2. 타겟 플랜이 결정되면 비용 및 플레이로그 가져오기
  useEffect(() => {
    if (!targetPlanId || !targetDate) return;

    const fetchReceiptDetails = async () => {
      // --- 비용 데이터 정산 로직 ---
      const { data: expData } = await supabase
        .from('gatan_plan_expenses')
        .select('*, boardgame_accounts(nickname)')
        .eq('plan_id', targetPlanId);

      if (expData) {
        const summaryMap: Record<string, ExpenseSummary> = {};
        
        expData.forEach(exp => {
          const accId = exp.account_id;
          if (!summaryMap[accId]) {
            summaryMap[accId] = {
              accountId: accId,
              nickname: exp.boardgame_accounts?.nickname || '알 수 없음',
              total: 0,
              details: {}
            };
          }
          
          summaryMap[accId].details[exp.category] = (summaryMap[accId].details[exp.category] || 0) + exp.price;
          
          if (exp.category === '감액') {
            summaryMap[accId].total -= exp.price;
          } else {
            summaryMap[accId].total += exp.price;
          }
        });
        setExpenses(Object.values(summaryMap));
      }

      // --- 플레이로그 데이터 가져오기 ---
      const { data: playData } = await supabase
        .from('boardgame_playlog')
        .select('id, boardgame_id, boardgame(title)')
        .eq('play_date', targetDate);

      if (playData) {
        setPlaylogs(playData);
      }
    };

    fetchReceiptDetails();
  }, [targetPlanId, targetDate]);

  // 3. 내 별점 정보 가져오기 (현재 사용자가 세팅된 이후)
  useEffect(() => {
    if (!currentAccountId || playlogs.length === 0) return;

    const fetchMyRatings = async () => {
      const playlogIds = playlogs.map(p => p.id);
      const { data: ratingData } = await supabase
        .from('boardgame_playlog_ratings')
        .select('playlog_id, rating')
        .eq('account_id', currentAccountId)
        .in('playlog_id', playlogIds);

      if (ratingData) {
        setPlaylogs(prev => prev.map(p => {
          const myRate = ratingData.find(r => r.playlog_id === p.id);
          return { ...p, myRating: myRate ? myRate.rating : 0 };
        }));
      }
    };
    fetchMyRatings();
  }, [currentAccountId, playlogs.length]);

  // --- 별점 UPDATE 전송 핸들러 ---
  const handleRatingSubmit = async (playlogId: string, ratingVal: number) => {
    if (!currentAccountId) {
      alert("메인 페이지에서 유저를 먼저 선택(로그인)해 주세요!");
      return;
    }
    
    const { error } = await supabase
      .from('boardgame_playlog_ratings')
      .update({ rating: ratingVal })
      .eq('playlog_id', playlogId)
      .eq('account_id', currentAccountId);

    if (error) {
      console.error("평가 전송 에러:", error);
      alert("평가 저장에 실패했습니다.");
    } else {
      setPlaylogs(prev => prev.map(p => p.id === playlogId ? { ...p, myRating: ratingVal } : p));
      alert("평가가 정상적으로 반영되었습니다.");
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">데이터를 불러오는 중입니다...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 pb-24">
      {/* 현재 접속자 정보 표시 영역 (선택창 제거됨) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end">
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600">👤 현재 접속자 :</span>
          {currentAccountId ? (
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              {currentUserNickname}
            </span>
          ) : (
            <span className="text-sm font-bold text-red-500">
              로그인 필요
            </span>
          )}
        </div>
      </div>

      <header className="max-w-4xl mx-auto flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
          <Home className="w-5 h-5" /> 메인으로
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900">정산 및 평가</h1>
        <div className="w-20" /> 
      </header>

      {targetDate ? (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 정산 요약 영역 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-3">
              🧾 {targetDate} 정산 내역
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-center table-auto border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200 text-sm text-slate-600">
                    <th className="p-3 font-bold">닉네임</th>
                    <th className="p-3 font-bold text-blue-600">최종 정산금액</th>
                    <th className="p-3 font-medium text-xs text-gray-400">상세 내역</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-800">{exp.nickname}</td>
                      <td className="p-4 font-extrabold text-lg text-blue-600">
                        {exp.total.toLocaleString()}원
                      </td>
                      <td className="p-4 text-xs text-gray-500 text-left w-1/2">
                        {Object.entries(exp.details).map(([cat, price]) => (
                          <span key={cat} className="inline-block mr-3 mb-1 bg-gray-100 px-2 py-1 rounded">
                            {cat}: {cat === '감액' ? <span className="text-red-500">-{(price as number).toLocaleString()}</span> : (price as number).toLocaleString()}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-gray-400 font-medium">등록된 비용 내역이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 플레이 평가 영역 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-3">
              🎲 오늘 플레이한 게임 평가
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playlogs.map((log) => (
                <div key={log.id} className="border border-gray-200 p-4 rounded-xl flex flex-col justify-between bg-slate-50 hover:border-indigo-300 transition-colors">
                  <div className="font-bold text-gray-800 mb-4">
                    {/* 정규식으로 한글명만 추출 */}
                    {log.boardgame?.title.replace(/\s*\(.*?\)/g, '').trim()}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          onClick={() => handleRatingSubmit(log.id, star)}
                          className={`w-6 h-6 cursor-pointer transition-colors ${
                            (log.myRating || 0) >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200 hover:fill-yellow-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {log.myRating ? '평가 완료' : '별을 눌러 평가하세요'}
                    </span>
                  </div>
                </div>
              ))}
              {playlogs.length === 0 && (
                <div className="col-span-full text-center text-gray-400 py-8">해당 날짜에 등록된 플레이 기록이 없습니다.</div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto text-center py-20 text-gray-500 font-bold bg-white rounded-2xl shadow-sm border border-gray-200">
          최근에 정산(영수증)이 완료된 일정이 없습니다.
        </div>
      )}
    </main>
  );
}