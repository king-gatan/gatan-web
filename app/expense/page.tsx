'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
  
  // 날짜 이동을 위한 상태 (모든 완료된 일정 목록과 현재 보고 있는 인덱스)
  const [validPlans, setValidPlans] = useState<{ id: string; meeting_date: string }[]>([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState<number>(0);
  
  const [targetDate, setTargetDate] = useState<string>('');
  const [targetPlanId, setTargetPlanId] = useState<string>('');
  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [playlogs, setPlaylogs] = useState<Playlog[]>([]);

  // 1. 초기 데이터 로드 (유저 확인 & 완료된 모든 일정 목록 가져오기)
  useEffect(() => {
    const fetchInitialData = async () => {
      const savedAccountId = localStorage.getItem('gatan_current_user');
      
      if (savedAccountId) {
        setCurrentAccountId(savedAccountId);
        const { data: userData } = await supabase
          .from('boardgame_accounts')
          .select('nickname')
          .eq('id', savedAccountId)
          .single();
        if (userData) setCurrentUserNickname(userData.nickname);
      }

      // gatan_plan에서 is_receipt_updated가 true인 "모든" 일정 최신순으로 가져오기
      const { data: planData } = await supabase
        .from('gatan_plan')
        .select('id, meeting_date')
        .eq('is_receipt_updated', true)
        .order('meeting_date', { ascending: false }); // 내림차순(최신이 0번 인덱스)

      if (planData && planData.length > 0) {
        setValidPlans(planData);
        setCurrentPlanIndex(0); // 화면에 처음 접속하면 무조건 0번(가장 최신)을 띄움
        setTargetDate(planData[0].meeting_date);
        setTargetPlanId(planData[0].id);
      }
      setIsLoading(false);
    };

    fetchInitialData();
  }, []);

  // 2. 타겟 플랜(날짜) 또는 현재 유저가 바뀔 때 통합 데이터 갱신 (비용 + 플레이로그 + 내 평점)
  useEffect(() => {
    if (!targetPlanId || !targetDate) return;

    const fetchReceiptDetails = async () => {
      // --- 비용 데이터 정산 ---
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
        // 💡 [핵심 해결] 플레이로그를 가져온 직후, 이 게임들에 대한 '내 평점'도 한 번에 가져옵니다.
        const ratingsMap: Record<string, number> = {};

        if (currentAccountId && playData.length > 0) {
          const playlogIds = playData.map((p: any) => p.id);
          const { data: ratingData } = await supabase
            .from('boardgame_playlog_ratings')
            .select('playlog_id, rating')
            .eq('account_id', currentAccountId)
            .in('playlog_id', playlogIds);

          if (ratingData) {
            ratingData.forEach(r => {
              ratingsMap[r.playlog_id] = r.rating; // { '플레이로그id': 5점 } 형태로 저장
            });
          }
        }

        // 게임 목록과 평점을 하나로 예쁘게 조립
        const formattedPlaylogs: Playlog[] = playData.map((item: any) => ({
          id: item.id,
          boardgame_id: item.boardgame_id,
          boardgame: {
            title: Array.isArray(item.boardgame) 
              ? item.boardgame[0]?.title 
              : item.boardgame?.title || '알 수 없는 게임'
          },
          myRating: ratingsMap[item.id] || 0 // DB에 평점이 있으면 넣고, 없으면 0점
        }));
        
        setPlaylogs(formattedPlaylogs);
      }
    };

    fetchReceiptDetails();
  }, [targetPlanId, targetDate, currentAccountId]); // 💡 현재 접속자가 바뀔 때도 즉시 다시 가져오도록 추가됨

  // --- 날짜 이동 핸들러 ---
  const handlePrevDate = () => {
    // 인덱스가 커질수록 과거 날짜임
    if (currentPlanIndex < validPlans.length - 1) {
      const newIndex = currentPlanIndex + 1;
      setCurrentPlanIndex(newIndex);
      setTargetDate(validPlans[newIndex].meeting_date);
      setTargetPlanId(validPlans[newIndex].id);
    }
  };

  const handleNextDate = () => {
    // 인덱스가 작아질수록 최신 날짜임
    if (currentPlanIndex > 0) {
      const newIndex = currentPlanIndex - 1;
      setCurrentPlanIndex(newIndex);
      setTargetDate(validPlans[newIndex].meeting_date);
      setTargetPlanId(validPlans[newIndex].id);
    }
  };

  // --- 별점 UPSERT (INSERT or UPDATE) 전송 핸들러 ---
  const handleRatingSubmit = async (playlogId: string, ratingVal: number) => {
    if (!currentAccountId) {
      alert("메인 페이지에서 유저를 먼저 선택(로그인)해 주세요!");
      return;
    }
    
    // update() 대신 upsert()를 사용합니다.
    const { error } = await supabase
      .from('boardgame_playlog_ratings')
      .upsert(
        { 
          playlog_id: playlogId, 
          account_id: currentAccountId, 
          rating: ratingVal 
        },
        { onConflict: 'playlog_id,account_id' } // UNIQUE 제약 조건을 기준으로 중복 판단
      );

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
      {/* 현재 접속자 정보 */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end">
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600">👤 현재 접속자 :</span>
          {currentAccountId ? (
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              {currentUserNickname}
            </span>
          ) : (
            <span className="text-sm font-bold text-red-500">로그인 필요</span>
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

      {validPlans.length > 0 ? (
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* --- 날짜 내비게이션 컨트롤 --- */}
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <button 
              onClick={handlePrevDate}
              disabled={currentPlanIndex === validPlans.length - 1}
              className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" /> 이전 모임
            </button>
            
            <h2 className="text-2xl font-bold text-indigo-900">
              {targetDate} 정산 내역
            </h2>
            
            <button 
              onClick={handleNextDate}
              disabled={currentPlanIndex === 0}
              className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              다음 모임 <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 정산 요약 영역 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
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
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-3 flex items-center gap-2">
              🎲 {targetDate} 플레이 게임 평가
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playlogs.map((log) => (
                <div key={log.id} className="border border-gray-200 p-4 rounded-xl flex flex-col justify-between bg-slate-50 hover:border-indigo-300 transition-colors">
                  <div className="font-bold text-gray-800 mb-4">
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
          정산이 완료된 일정이 없습니다.
        </div>
      )}
    </main>
  );
}