'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, MapPin, Clock, CalendarX, ChefHat, Utensils, History } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- 타입 정의 ---
type Restaurant = {
  id: string;
  title: string;
  place_type: string;
  food_type: string;
  last_order_time: string | null;
  day_off: string[] | null;
  signature_menu: string[] | null;
};

type VisitLog = {
  id: string;
  visit_date: string;
  restaurant: { title: string } | null;
};

export default function FoodPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'충북대' | '성안길'>('충북대');
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);

  // 1. 초기 데이터 로드 (식당 목록 및 방문 이력)
  useEffect(() => {
    const fetchFoodData = async () => {
      try {
        // 1-1. 식당 데이터 가져오기
        const { data: resData, error: resError } = await supabase
          .from('restaurant')
          .select('id, title, place_type, food_type, last_order_time, day_off, signature_menu');

        if (resError) console.error("❌ 식당 로드 에러:", resError);
        if (resData) setRestaurants(resData);

        // 1-2. 식당 방문 이력 가져오기 (최신 방문일 순)
        const { data: logData, error: logError } = await supabase
          .from('restaurant_log')
          .select('id, visit_date, restaurant(title)')
          .order('visit_date', { ascending: false });

        if (logError) console.error("❌ 방문 이력 로드 에러:", logError);
        
        if (logData) {
          // 조인된 데이터 안전하게 파싱
          const formattedLogs = logData.map((log: any) => ({
            id: log.id,
            visit_date: log.visit_date,
            restaurant: Array.isArray(log.restaurant) ? log.restaurant[0] : log.restaurant
          }));
          setVisitLogs(formattedLogs);
        }
      } catch (err) {
        console.error("❌ 알 수 없는 에러 발생:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoodData();
  }, []);

  // 2. 현재 선택된 탭(지역)의 식당들을 음식 분류(food_type)별로 그룹화
  const groupedRestaurants = restaurants
    .filter(r => r.place_type === activeTab && r.food_type) // 해당 지역이고 food_type이 있는 것만
    .reduce((acc: Record<string, Restaurant[]>, curr) => {
      if (!acc[curr.food_type]) {
        acc[curr.food_type] = [];
      }
      acc[curr.food_type].push(curr);
      return acc;
    }, {});

  // 시간 포맷 헬퍼 (예: '21:30:00' -> '21:30')
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '정보 없음';
    return timeString.substring(0, 5);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">맛집 데이터를 불러오는 중입니다...</div>;

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-6 md:p-12 pb-24">
      {/* 헤더 */}
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-10">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors">
          <Home className="w-5 h-5" /> 메인으로
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
          <Utensils className="w-8 h-8 text-[#00c885]" /> 오늘 뭐먹
        </h1>
        <div className="w-24" /> {/* 중앙 정렬 맞춤용 */}
      </header>

      {/* 메인 레이아웃 (왼쪽: 식당 리스트, 오른쪽: 방문 이력) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 왼쪽 영역 (식당 리스트 - 2칸 차지) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 지역 탭 버튼 */}
          <div className="flex bg-white rounded-2xl shadow-sm border border-gray-200 p-2 gap-2">
            <button
              onClick={() => setActiveTab('충북대')}
              className={`flex-1 py-3 font-bold rounded-xl flex justify-center items-center gap-2 transition-all ${
                activeTab === '충북대' ? 'bg-[#1c2331] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4" /> 충북대 맛집
            </button>
            <button
              onClick={() => setActiveTab('성안길')}
              className={`flex-1 py-3 font-bold rounded-xl flex justify-center items-center gap-2 transition-all ${
                activeTab === '성안길' ? 'bg-[#1c2331] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4" /> 성안길 맛집
            </button>
          </div>

          {/* 분류별 식당 목록 렌더링 */}
          {Object.keys(groupedRestaurants).length > 0 ? (
            Object.entries(groupedRestaurants).map(([foodType, resList]) => (
              <section key={foodType} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-[#f1f5f9] px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                  <span className="text-xl font-extrabold text-slate-800">{foodType}</span>
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                    {resList.length}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {resList.map((res, idx) => (
                    <div 
                      key={res.id} 
                      className={`p-6 border-b border-gray-100 hover:bg-[#fafafa] transition-colors flex flex-col justify-between ${
                        idx % 2 === 0 ? 'md:border-r' : ''
                      }`}
                    >
                      <div>
                        <h3 className="text-xl font-black text-gray-900 mb-4">{res.title}</h3>
                        
                        <div className="space-y-2.5 mb-5">
                          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                            <Clock className="w-4 h-4 text-orange-500" />
                            라스트 오더: <span className="font-bold text-gray-800">{formatTime(res.last_order_time)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                            <CalendarX className="w-4 h-4 text-red-500" />
                            휴무일: 
                            <span className="font-bold text-gray-800">
                              {res.day_off && res.day_off.length > 0 ? res.day_off.join(', ') : '연중무휴'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 시그니처 메뉴 태그 */}
                      {res.signature_menu && res.signature_menu.length > 0 && (
                        <div className="mt-auto pt-4 border-t border-gray-50 flex flex-wrap gap-1.5 items-start">
                          <ChefHat className="w-4 h-4 text-indigo-500 mt-0.5" />
                          {res.signature_menu.map(menu => (
                            <span key={menu} className="bg-indigo-50 text-indigo-600 text-[11px] font-bold px-2 py-1 rounded">
                              {menu}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <span className="text-gray-400 font-bold text-lg">해당 지역에 등록된 식당이 없습니다.</span>
            </div>
          )}
        </div>

        {/* 오른쪽 영역 (방문 이력 - 1칸 차지) */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <History className="w-5 h-5 text-blue-500" /> 모임 방문 이력
            </h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {visitLogs.length > 0 ? (
                visitLogs.map((log) => (
                  <div key={log.id} className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-gray-400">
                      {log.visit_date}
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {log.restaurant?.title || '알 수 없는 식당'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 font-medium text-sm">
                  아직 방문 기록이 없습니다.
                </div>
              )}
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}