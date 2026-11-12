'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Search, Trophy, FileText, Youtube, BookOpen, PlusCircle } from 'lucide-react';

// 임시 모의 데이터 (DB 연동 시 boardgame_collection 테이블에서 가져옴)
const MOCK_GAMES = [
  {
    id: 1,
    title: '테라포밍 마스',
    genre: '전략',
    isExpansion: false,
    bestPlayers: '3인',
    playTime: '120분',
    weight: 3.24,
    tags: ['#엔진빌딩', '#화성개척', '#SF'],
    rulebook: '/rules/tm_rulebook.pdf', // 로컬 public 폴더 참조
    ruleVideo: 'https://youtube.com/...',
    summary: '/rules/tm_summary.pdf'
  },
  {
    id: 2,
    title: '테라포밍 마스: 서곡',
    genre: '전략',
    isExpansion: true,
    bestPlayers: '3인',
    playTime: '120분',
    weight: 3.10,
    tags: ['#필수확장', '#초반부스팅'],
    rulebook: '/rules/tm_prelude.pdf',
    ruleVideo: null,
    summary: null
  },
  {
    id: 3,
    title: '스플렌더',
    genre: '가족',
    isExpansion: false,
    bestPlayers: '3-4인',
    playTime: '30분',
    weight: 1.79,
    tags: ['#입문용', '#셋콜렉션', '#보석'],
    rulebook: '/rules/splendor.pdf',
    ruleVideo: 'https://youtube.com/...',
    summary: '/rules/splendor_summary.pdf'
  },
  {
    id: 4,
    title: '아그리콜라',
    genre: '일꾼놓기',
    isExpansion: false,
    bestPlayers: '3-4인',
    playTime: '90분',
    weight: 3.64,
    tags: ['#농장경영', '#밥먹이기', '#우베'],
    rulebook: '/rules/agricola.pdf',
    ruleVideo: 'https://youtube.com/...',
    summary: null
  },
];

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('genre');

  // 검색 및 정렬 로직
  const filteredAndSortedGames = [...MOCK_GAMES]
    .filter(game => game.title.includes(searchQuery) || game.tags.some(tag => tag.includes(searchQuery)))
    .sort((a, b) => {
      // 1차 정렬: 선택된 옵션 기준 (기본값 장르순)
      if (sortOption === 'genre') {
        const genreCompare = a.genre.localeCompare(b.genre);
        // 2차 정렬: 이름순 (장르가 같을 경우)
        if (genreCompare === 0) return a.title.localeCompare(b.title);
        return genreCompare;
      }
      // TODO: 다른 정렬 기준(베스트 인원순, 최근 플레이 순 등)은 DB 로그 조인이 필요하므로 임시로 이름순 처리
      return a.title.localeCompare(b.title);
    });

  const handleWishlistAdd = (gameTitle: string) => {
    // DB 연동 시 gatan_plan_wishlist 테이블에 INSERT 처리
    alert(`[${gameTitle}] 위시리스트에 추가되었습니다!`);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 pb-24">
      {/* 상단 네비게이션 및 타이틀 */}
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
          <Home className="w-5 h-5" /> 메인으로
        </Link>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-wider">보드게임 카탈로그</h1>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm text-sm">
          <Trophy className="w-4 h-4" />
          티어리스트 생성 <span className="font-normal opacity-75 text-xs">(향후 구현)</span>
        </button>
      </header>

      {/* 컨트롤 패널 (정렬 및 검색) */}
      <section className="max-w-7xl mx-auto bg-slate-800 p-4 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row gap-4 items-center">
        {/* 정렬 드롭다운 */}
        <div className="w-full md:w-48 shrink-0">
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
          >
            <option value="genre">장르순</option>
            <option value="bestPlayer">베스트 인원순</option>
            <option value="recent">최근 플레이 순</option>
            <option value="oldest">오래된 플레이 순</option>
            <option value="rating">평점순 (향후 구현)</option>
          </select>
        </div>

        {/* 검색 바 */}
        <div className="flex-1 flex w-full">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="게임 이름이나 태그를 입력하세요" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-0 rounded-l-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-400"
            />
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-r-xl font-bold transition-colors shrink-0">
            검색
          </button>
        </div>
      </section>

      {/* 게임 카드 그리드 */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedGames.map(game => (
          <div key={game.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
            
            {/* 상단 뱃지 및 위시 버튼 영역 */}
            <div className="flex justify-between items-start p-3 border-b border-gray-100 bg-slate-50">
              <div className="flex gap-2">
                <span className="bg-orange-500 text-white px-2.5 py-1 rounded-md text-xs font-extrabold shadow-sm">
                  {game.genre}
                </span>
                {game.isExpansion && (
                  <span className="bg-slate-700 text-white px-2.5 py-1 rounded-md text-xs font-extrabold shadow-sm">
                    확장
                  </span>
                )}
              </div>
              <button 
                onClick={() => handleWishlistAdd(game.title)}
                className="flex items-center gap-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded text-xs font-bold transition-colors shadow-sm"
              >
                <PlusCircle className="w-3 h-3" /> Play Wish
              </button>
            </div>

            {/* 메인 정보 영역 */}
            <div className="p-5 flex-1 flex flex-col items-center text-center relative">
              {/* 이미지 플레이스홀더 (실제 구현 시 Image 컴포넌트로 교체) */}
              <div className="w-32 h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 mb-4 flex items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-500">
                사진 영역
              </div>
              
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">{game.title}</h3>
              
              <div className="text-sm font-bold text-gray-600 mb-3 bg-gray-100 px-3 py-1 rounded-full">
                베스트 {game.bestPlayers}
              </div>
              
              {/* 태그 리스트 */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                {game.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {tag}
                  </span>
                ))}
              </div>

              {/* 하단 스탯 */}
              <div className="w-full flex justify-between items-center text-sm font-semibold text-gray-500 mt-auto pt-4 border-t border-gray-100">
                <span>타임: {game.playTime}</span>
                <span>웨이트: {game.weight}</span>
              </div>
            </div>

            {/* 하단 링크 버튼 영역 */}
            <div className="grid grid-cols-3 divide-x divide-slate-600 border-t-2 border-slate-800">
              <button 
                className={`p-2.5 flex justify-center items-center gap-1.5 text-sm font-bold transition-colors ${game.rulebook ? 'bg-slate-700 text-white hover:bg-slate-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                disabled={!game.rulebook}
              >
                <FileText className="w-4 h-4" /> 룰북
              </button>
              <button 
                className={`p-2.5 flex justify-center items-center gap-1.5 text-sm font-bold transition-colors ${game.ruleVideo ? 'bg-slate-700 text-white hover:bg-slate-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                disabled={!game.ruleVideo}
              >
                <Youtube className="w-4 h-4" /> 룰영상
              </button>
              <button 
                className={`p-2.5 flex justify-center items-center gap-1.5 text-sm font-bold transition-colors ${game.summary ? 'bg-slate-700 text-white hover:bg-slate-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                disabled={!game.summary}
              >
                <BookOpen className="w-4 h-4" /> 룰정리
              </button>
            </div>
            
          </div>
        ))}
      </div>
    </main>
  );
}