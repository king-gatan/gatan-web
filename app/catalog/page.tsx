'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Search, PlaySquare, FileText, MonitorPlay, X, Check, Heart } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- 타입 정의 ---
type Boardgame = {
  id: string;
  title: string;
  game_type: string[];
  best_player: number[];
  min_play_time_min: number; // 추가됨
  max_play_time_min: number; // 추가됨
  weight: number;
  rule_video_url: string;
};

type CollectionGame = {
  id: string;
  boardgame_id: string;
  catalog_tags: string[];
  boardgame: Boardgame;
  last_play_date: string | null;
};

export default function CatalogPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // 전체 데이터 및 화면 표시 데이터
  const [allGames, setAllGames] = useState<CollectionGame[]>([]);
  const [filteredGames, setFilteredGames] = useState<CollectionGame[]>([]);
  
  // Storage 파일 존재 여부 캐싱
  const [availableRulebooks, setAvailableRulebooks] = useState<Set<string>>(new Set());
  const [availableSummaries, setAvailableSummaries] = useState<Set<string>>(new Set());
  
  // 검색 및 정렬 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortOption, setSortOption] = useState('genre');

  // 1. 초기 데이터 로드 (Collection + Boardgame + Playlog + Storage Check)
  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        const savedUserId = localStorage.getItem('gatan_current_user');
        if (savedUserId) setCurrentUserId(savedUserId);

        // 1-1. boardgame_collection과 boardgame 조인하여 가져오기
        const { data: collectionData, error: collectionError } = await supabase
          .from('boardgame_collection')
          .select(`
            id, 
            boardgame_id, 
            catalog_tags,
            boardgame (
              id, title, game_type, best_player, weight, min_play_time_min, max_play_time_min, rule_video_url
            )
          `);

        // 🚨 [핵심] 에러가 발생하면 콘솔에 출력해서 원인을 찾습니다.
        if (collectionError) {
          console.error("❌ 카탈로그 조인 에러:", collectionError);
        }

        // 데이터가 없으면 로딩만 끄고 중단
        if (!collectionData) {
          setIsLoading(false);
          return;
        }

        // 1-2. 플레이로그 가져와서 게임별 최신 플레이 날짜 계산
        const { data: playlogData } = await supabase
          .from('boardgame_playlog')
          .select('boardgame_id, play_date');

        const playDateMap: Record<string, string> = {};
        if (playlogData) {
          playlogData.forEach(log => {
            const currentMax = playDateMap[log.boardgame_id];
            if (!currentMax || new Date(log.play_date) > new Date(currentMax)) {
              playDateMap[log.boardgame_id] = log.play_date;
            }
          });
        }

        // 1-3. Storage 파일 목록 가져와서 존재하는 파일 확인
        const { data: officialFiles, error: offError } = await supabase.storage.from('gatan-web-storage').list('rule_official', { limit: 1000 });
        const { data: summaryFiles, error: sumError } = await supabase.storage.from('gatan-web-storage').list('rule_summary', { limit: 1000 });
        
        if (offError) console.error("❌ 공식 룰북 스토리지 에러:", offError);
        if (sumError) console.error("❌ 룰 요약 스토리지 에러:", sumError);

        const offSet = new Set(officialFiles?.map(f => f.name.split('.')[0]) || []);
        const sumSet = new Set(summaryFiles?.map(f => f.name.split('.')[0]) || []);
        setAvailableRulebooks(offSet);
        setAvailableSummaries(sumSet);

        // 데이터 병합 (Collection 목록 기준)
        const combined: CollectionGame[] = collectionData.map((c: any) => ({
          id: c.id,
          boardgame_id: c.boardgame_id,
          catalog_tags: c.catalog_tags || [],
          boardgame: Array.isArray(c.boardgame) ? c.boardgame[0] : c.boardgame,
          last_play_date: playDateMap[c.boardgame_id] || null,
        }));

        setAllGames(combined);
      } catch (err) {
        console.error("❌ 알 수 없는 에러 발생:", err);
      } finally {
        // 성공하든 에러가 나든 무조건 로딩 화면을 종료합니다.
        setIsLoading(false); 
      }
    };

    fetchCatalogData();
  }, []);

  // 2. 검색, 태그 필터링, 정렬 적용 (상태가 바뀔 때마다 실행)
  useEffect(() => {
    let result = [...allGames];

    // 태그 필터링
    if (selectedTag) {
      result = result.filter(g => g.catalog_tags?.includes(selectedTag));
    }

    // 텍스트 검색 (이름 또는 태그)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => 
        g.boardgame.title.toLowerCase().includes(q) || 
        g.catalog_tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // 정렬
    result.sort((a, b) => {
      if (sortOption === 'genre') {
        const genreA = a.boardgame.game_type?.[0] || '';
        const genreB = b.boardgame.game_type?.[0] || '';
        return genreA.localeCompare(genreB);
      } 
      else if (sortOption === 'best_player') {
        const bpA = a.boardgame.best_player?.[0] || 999;
        const bpB = b.boardgame.best_player?.[0] || 999;
        return bpA - bpB;
      }
      else if (sortOption === 'recent') {
        // null 값(플레이 안 한 게임)은 항상 뒤로
        if (!a.last_play_date) return 1;
        if (!b.last_play_date) return -1;
        return new Date(b.last_play_date).getTime() - new Date(a.last_play_date).getTime();
      }
      else if (sortOption === 'oldest') {
        if (!a.last_play_date) return 1;
        if (!b.last_play_date) return -1;
        return new Date(a.last_play_date).getTime() - new Date(b.last_play_date).getTime();
      }
      return 0;
    });

    setFilteredGames(result);
  }, [allGames, searchQuery, selectedTag, sortOption]);

  // 3. 위시리스트 추가 핸들러
  const handleAddWish = async (boardgameId: string, title: string) => {
    if (!currentUserId) {
      alert("로그인이 필요합니다.");
      return;
    }

    const { error } = await supabase
      .from('gatan_plan_wishlist')
      .insert({ boardgame_id: boardgameId, account_id: currentUserId });

    if (error) {
      // UNIQUE 제약 조건에 걸려 이미 추가된 경우
      if (error.code === '23505') {
        alert(`'${title}' 은(는) 이미 위시리스트에 담겨 있습니다!`);
      } else {
        alert("오류가 발생했습니다.");
        console.error(error);
      }
    } else {
      alert(`'${title}' 이(가) 위시리스트에 추가되었습니다!`);
    }
  };

  // 타이틀 포맷팅 (영문 제거)
  const formatTitle = (title: string) => title.replace(/\s*\(.*?\)/g, '').trim();

  // Storage 공용 URL 가져오기 헬퍼
  const getStorageUrl = (folder: string, id: string, ext: string = 'png') => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gatan-web-storage/${folder}/${id}.${ext}`;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">카탈로그를 불러오는 중입니다...</div>;

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-6 md:p-12 pb-24">
      {/* 헤더 */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors">
          <Home className="w-5 h-5" /> 메인으로
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
          보드게임 카탈로그
        </h1>
        {/* 티어리스트 (향후 구현용 빈 버튼) */}
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm opacity-80 cursor-not-allowed">
          🏆 티어리스트 생성 (향후 구현)
        </button>
      </header>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* 검색 및 컨트롤 바 */}
        <div className="bg-[#1c2331] rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-lg">
          <select 
            className="bg-[#2a3447] text-white px-4 py-3 rounded-xl font-bold outline-none cursor-pointer border border-transparent focus:border-indigo-400"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="genre">장르순</option>
            <option value="best_player">베스트 인원순</option>
            <option value="recent">최근 플레이순</option>
            <option value="oldest">오래된 플레이순</option>
          </select>

          <div className="flex-1 flex bg-white rounded-xl overflow-hidden focus-within:ring-2 ring-indigo-500 transition-shadow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="게임 이름이나 태그를 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-12 pr-4 font-medium text-gray-800 outline-none"
            />
          </div>

          <button className="bg-[#00c885] hover:bg-[#00a86f] text-white font-bold px-8 py-3 rounded-xl transition-colors">
            검색
          </button>
        </div>

        {/* 선택된 태그 표시 영역 */}
        {selectedTag && (
          <div className="flex items-center gap-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg w-max font-bold text-sm">
            <span>태그 필터: #{selectedTag}</span>
            <button onClick={() => setSelectedTag('')} className="p-1 hover:bg-indigo-200 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 게임 그리드 카드 UI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((item) => {
            const game = item.boardgame;
            const mainGenre = game.game_type?.[0];
            const bestPlayerList = game.best_player || [];
            
            // 베스트 인원 텍스트 변환 (1,2 -> 1-2인)
            let bestPlayerText = '';
            if (bestPlayerList.length > 0) {
              const min = bestPlayerList[0];
              const max = bestPlayerList[bestPlayerList.length - 1];
              bestPlayerText = min === max ? `${min}인` : `${min}-${max}인`;
            }

            // 👇 새로 추가할 플레이 타임 변환 로직
            const minTime = game.min_play_time_min;
            const maxTime = game.max_play_time_min;
            let playTimeText = '?';
            
            if (minTime && maxTime) {
              // 값이 모두 있고 같으면 하나만, 다르면 범위로 표시
              playTimeText = minTime === maxTime ? `${minTime}` : `${minTime}-${maxTime}`;
            } else if (minTime || maxTime) {
              // 둘 중 하나만 값이 있으면 그 값만 표시
              playTimeText = `${minTime || maxTime}`;
            }            

            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-indigo-200 group">
                
                {/* 카드 상단 배지 및 위시 버튼 */}
                <div className="flex justify-between items-center p-4 pb-2">
                  <div className="flex gap-1.5">
                    {mainGenre && (
                      <span className="bg-[#ff7a00] text-white text-[11px] font-bold px-2 py-1 rounded">
                        {mainGenre}
                      </span>
                    )}
                    {/* 확장판일 경우 태그 임시 예시 (추후 collect_type 연동 가능) */}
                    {item.catalog_tags?.includes('확장') && (
                      <span className="bg-[#1e293b] text-white text-[11px] font-bold px-2 py-1 rounded">
                        확장
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleAddWish(game.id, formatTitle(game.title))}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                  >
                    <Heart className="w-3 h-3" /> Play Wish
                  </button>
                </div>

                {/* 게임 이미지 */}
                <div className="relative w-full aspect-square bg-gray-50 flex items-center justify-center p-4">
                  {/* Supabase Storage 에서 id.png 또는 jpg 를 호출 (실패시 기본 텍스트) */}
                  <img 
                    src={getStorageUrl('images', game.id, 'png')} 
                    onError={(e) => {
                      // png 실패시 jpg 시도 로직 등을 넣을 수 있습니다.
                      (e.target as HTMLImageElement).src = getStorageUrl('images', game.id, 'jpg');
                    }}
                    alt={game.title}
                    className="object-contain w-full h-full drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* 게임 정보 텍스트 영역 */}
                <div className="p-5 flex flex-col flex-1 text-center">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-1">
                    {formatTitle(game.title)}
                  </h3>
                  <div className="text-sm font-bold text-gray-400 mb-4">
                    베스트 {bestPlayerText}
                  </div>
                  
                  {/* 클릭 가능한 태그 */}
                  <div className="flex flex-wrap justify-center gap-1.5 mb-5 mt-auto">
                    {item.catalog_tags?.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className="text-[11px] font-bold text-[#00c885] bg-[#e6f9f2] px-2 py-1 rounded hover:bg-[#00c885] hover:text-white transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>

                  {/* 👇 수정 후 */}
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 pt-3 border-t border-gray-100">
                    <span>타임: {playTimeText}분</span>
                    <span>웨이트: {game.weight}</span>
                  </div>
                </div>

                {/* 하단 룰 관련 버튼 3개 */}
                <div className="grid grid-cols-3 bg-[#1e293b] text-white">
                  {/* 룰북 (pdf 존재 여부 확인) */}
                  <button 
                    disabled={!availableRulebooks.has(game.id)}
                    onClick={() => window.open(getStorageUrl('rule_official', game.id, 'pdf'))}
                    className="flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold border-r border-gray-600 disabled:opacity-30 hover:bg-slate-700 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> 룰북
                  </button>
                  
                  {/* 룰영상 (URL 존재 여부 확인) */}
                  <button 
                    disabled={!game.rule_video_url}
                    onClick={() => window.open(game.rule_video_url)}
                    className="flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold border-r border-gray-600 disabled:opacity-30 hover:bg-slate-700 transition-colors"
                  >
                    <MonitorPlay className="w-3.5 h-3.5" /> 룰영상
                  </button>
                  
                  {/* 룰정리 (pdf 존재 여부 확인) */}
                  <button 
                    disabled={!availableSummaries.has(game.id)}
                    onClick={() => window.open(getStorageUrl('rule_summary', game.id, 'pdf'))}
                    className="flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold disabled:opacity-30 hover:bg-slate-700 transition-colors"
                  >
                    <PlaySquare className="w-3.5 h-3.5" /> 룰정리
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {filteredGames.length === 0 && !isLoading && (
          <div className="text-center py-20 text-gray-400 font-bold text-lg">
            조건에 맞는 게임이 없습니다.
          </div>
        )}
      </div>
    </main>
  );
}