'use client';

import Link from 'next/link';
import { Home, Utensils, History, Clock, MapPin } from 'lucide-react';

// 지역별 식당 데이터를 배열로 관리하도록 구조 변경
const MOCK_AREAS = [
  {
    title: '충북대 식당 리스트',
    data: {
      밥: [
        { name: '교반', desc: '비빔밥', lastOrder: '20:20' },
        { name: '쿡메시야', desc: '일식', lastOrder: '20:30' },
        { name: '호랑가', desc: '김치찌개', lastOrder: '20:00' },
        { name: '우주식탁', desc: '백반', lastOrder: '19:20', offDay: '일 휴무' },
        { name: '최부짱', desc: '일식', lastOrder: '21:30', offDay: '일 휴무' },
        { name: '또또와식당', desc: '순두부', lastOrder: '20:00' },
      ],
      면: [
        { name: '멘야마쯔리', desc: '일식', lastOrder: '20:00', offDay: '토 휴무' },
        { name: '탄탄면공방', desc: '', lastOrder: '19:30' },
        { name: '육쌈냉면', desc: '', lastOrder: '20:40' },
        { name: '웍스터', desc: '미국식 중식', lastOrder: '20:30' },
        { name: '행복한우동가게', desc: '', lastOrder: '02:00' },
      ],
      빵: [
        { name: '부리부리부리또', desc: '', lastOrder: '20:00' },
        { name: '피자웨이브', desc: '', lastOrder: '23:00' },
        { name: '롯데리아', desc: '', lastOrder: '23:00' },
        { name: '서브웨이', desc: '', lastOrder: '22:00' },
        { name: '맘스터치', desc: '', lastOrder: '20:00' },
      ],
      고기: [
        { name: 'KFC', desc: '', lastOrder: '01:00' },
        { name: '왕천파닭', desc: '', lastOrder: '00:00' },
        { name: '충만치킨', desc: '', lastOrder: '00:00' },
        { name: '꼬불꼬불', desc: '닭갈비', lastOrder: '21:00', offDay: '일 휴무' },
        { name: '자연을 담은 돈까스', desc: '', lastOrder: '23:00' },
      ],
      술집: [
        { name: '폼프리츠', desc: '감자튀김', lastOrder: '01:00' },
        { name: '와와떡볶이', desc: '', lastOrder: '23:00', offDay: '토 휴무' },
        { name: '코리아닭발', desc: '', lastOrder: '01:30' },
        { name: '너구리', desc: '한식주점', lastOrder: '03:00' },
        { name: '단토리', desc: '꼬치', lastOrder: '03:00' },
      ]
    }
  },
  {
    title: '성안길 식당 리스트',
    data: {
      밥: [
        { name: '청주함박', desc: '함박스테이크', lastOrder: '20:30' },
        { name: '상무초밥', desc: '일식', lastOrder: '21:00' },
        { name: '성안길불고기', desc: '백반', lastOrder: '20:00' },
      ],
      면: [
        { name: '중앙모밀', desc: '모밀/우동', lastOrder: '19:30' },
        { name: '니뽕내뽕', desc: '퓨전짬뽕', lastOrder: '20:30' },
      ],
      빵: [
        { name: '쫄쫄호떡', desc: '명물', lastOrder: '19:30' },
        { name: '성심당(가짜)', desc: '베이커리', lastOrder: '22:00' },
      ],
      고기: [
        { name: '청심재', desc: '삼겹살', lastOrder: '22:00', offDay: '화 휴무' },
        { name: '무심천숯불갈비', desc: '갈비', lastOrder: '21:30' },
      ],
      술집: [
        { name: '성안길맥주', desc: '호프', lastOrder: '02:00' },
      ]
    }
  }
];

const MOCK_HISTORY = [
  { date: '10/31', name: '북경탕수육' },
  { date: '09/20', name: '멘야마쯔리' },
  { date: '08/23', name: '청주함박' },
  { date: '08/15', name: '서브웨이, BHC' },
  { date: '08/06', name: '중앙로파돈까스' },
  { date: '07/25', name: '최부짱' },
  { date: '07/19', name: '자연을 담은 돈까스' },
  { date: '07/05', name: '멘야마쯔리' },
  { date: '06/07', name: '마인네하우스' },
  { date: '05/17', name: '킹스햄버거' },
  { date: '05/17', name: '쇼킹' },
  { date: '05/02', name: '탄탄면공방' },
  { date: '04/19', name: '은화수식당' },
];

export default function FoodPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 pb-24">
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-10">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
          <Home className="w-5 h-5" /> 메인으로
        </Link>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-wider">오늘 뭐먹</h1>
        <div className="w-20" /> 
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* 좌측: 식당 리스트 영역 (여러 개가 아래로 쌓임) */}
        <section className="lg:col-span-3 flex flex-col gap-8">
          {MOCK_AREAS.map((area, areaIdx) => (
            <div key={areaIdx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  {area.title}
                </h2>
                <span className="text-sm text-slate-300 font-medium">라스트 오더 기준</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {Object.keys(area.data).map((category, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="bg-slate-50 py-3 text-center font-extrabold text-slate-700 border-b border-gray-200">
                      {idx + 1}. {category}
                    </div>
                    <div className="p-2 space-y-2">
                      {(area.data as any)[category].map((rest: any, restIdx: number) => (
                        <div key={restIdx} className="bg-white p-3 rounded-lg border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group">
                          <div className="flex flex-wrap items-baseline gap-1.5 mb-1">
                            <span className="font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                              {rest.name}
                            </span>
                            {rest.desc && (
                              <span className="text-xs font-medium text-gray-500">
                                ({rest.desc})
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-medium text-slate-600">
                              <Clock className="w-3 h-3" /> {rest.lastOrder}
                            </span>
                            {rest.offDay && (
                              <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                                {rest.offDay}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* 우측: 식당 방문 이력 영역 (Sticky 적용으로 스크롤을 따라다님) */}
        <section className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col sticky top-6 max-h-[calc(100vh-3rem)]">
          <div className="bg-slate-800 text-white p-4 shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5" />
              식당 방문 이력
            </h2>
          </div>
          
          <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
            {MOCK_HISTORY.map((hist, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-gray-100 transition-colors">
                <div className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-sm shrink-0">
                  {hist.date}
                </div>
                <div className="font-semibold text-gray-800">
                  {hist.name}
                </div>
              </div>
            ))}
          </div>
        </section>
        
      </div>
    </main>
  );
}