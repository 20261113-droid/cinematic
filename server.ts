import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// File-based database paths
const REVIEWS_FILE = path.join(process.cwd(), "reviews.json");
const CACHE_FILE = path.join(process.cwd(), "box_office_cache.json");

// Helper to get yesterday's date string in YYYY-MM-DD
function getYesterdayDateString() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// In-memory preset fallback matching recent high-audience blockbusters
const DEFAULT_MOVIES = [
  {
    rank: 1,
    rankInten: "0",
    title: "범죄도시4",
    openDt: "2024-04-24",
    audiCnt: 324150,
    audiAcc: 11450230,
    director: "허명행",
    actors: ["마동석", "김무열", "박지환", "이동휘"],
    genre: "범죄, 액션",
    showTm: "109분",
    synopsis: "신종 마약 사건 조사 중 수사팀은 수배 중인 앱 개발자가 필리핀에서 사망한 사건이 대규모 온라인 불법 도박 조직과 연계되어 있음을 알아챈다. 마석도는 더욱 고도화된 스케일의 소탕 작전을 개시한다!",
    rating: 8.8,
    posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80",
    trailerId: "kL69796Y8M8" // Fake or Search keyword fallback handles it
  },
  {
    rank: 2,
    rankInten: "+1",
    title: "인사이드 아웃 2",
    openDt: "2024-06-12",
    audiCnt: 285400,
    audiAcc: 8125430,
    director: "켈시 맨",
    actors: ["에이미 포엘러", "마야 호크", "필리스 스미스"],
    genre: "애니메이션, 코미디",
    showTm: "96분",
    synopsis: "13살이 된 라일리의 행복한 일상을 지키기 위해 바쁘게 머릿속을 굴리는 기쁨, 슬픔, 버럭, 까칠, 소심. 하지만 어느 날, 사춘기 경보가 울리고 낯선 가치관과 '불안', '당황', '따분', '시샘'이라는 새 감정들이 등장한다!",
    rating: 9.1,
    posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
    trailerId: "L4D5McD0X_A"
  },
  {
    rank: 3,
    rankInten: "-1",
    title: "파묘",
    openDt: "2024-02-22",
    audiCnt: 125400,
    audiAcc: 11912900,
    director: "장재현",
    actors: ["최민식", "김고은", "유해진", "이도현"],
    genre: "미스터리, 오컬트",
    showTm: "134분",
    synopsis: "미국 LA, 거액의 의뢰를 받은 무당 화림과 봉길은 조상의 묫자리가 화근임을 알아채고 악지 중의 악지의 묘를 파헤치기 위해 최고의 지관 상덕과 장의사 영근이 합세한다.",
    rating: 9.0,
    posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80",
    trailerId: "sfSreM7IOnw"
  },
  {
    rank: 4,
    rankInten: "New",
    title: "퓨리오사: 매드맥스 사가",
    openDt: "2024-05-22",
    audiCnt: 98120,
    audiAcc: 1564300,
    director: "조지 밀러",
    actors: ["안야 테일러 조이", "크리스 헴스워스"],
    genre: "액션, SF, 어드벤처",
    showTm: "148분",
    synopsis: "문명 붕괴 45년 후, 황무지에 사로잡힌 젊은 퓨리오사가 고향 '풍요의 땅'으로 돌아가기 위해 일생의 사투를 펼쳐나가는 파란만장한 연대기.",
    rating: 8.9,
    posterUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
    trailerId: "eY7H_Wv9K0E"
  },
  {
    rank: 5,
    rankInten: "0",
    title: "설계자",
    openDt: "2024-05-29",
    audiCnt: 74200,
    audiAcc: 612500,
    director: "이요섭",
    actors: ["강동원", "이무생", "이미숙", "이현욱"],
    genre: "범죄, 드라마",
    showTm: "99분",
    synopsis: "의뢰받은 청부 살인을完璧한 '사고'로 조작하는 설계자 영일. 이번에도 완벽한 타겟의 제거를 눈앞에 두고 지독한 의심과 숨막히는 추적이 그를 옭아맨다.",
    rating: 7.2,
    posterUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
    trailerId: "Cebk2Y73vB8"
  },
  {
    rank: 6,
    rankInten: "+2",
    title: "원더랜드",
    openDt: "2024-06-05",
    audiCnt: 65120,
    audiAcc: 552100,
    director: "김태용",
    actors: ["탕웨이", "수지", "박보검", "정유미", "최우식"],
    genre: "SF, 판타지, 드라마",
    showTm: "113분",
    synopsis: "죽은 사람을 백업하여 인공지능으로 복원해주는 원더랜드 서비스. 우주에 가 있는 고고학자 엄마, 사고로 누워있는 남자친구와 다시 소통하기 시작하는 사람들의 감동 스캔들.",
    rating: 7.9,
    posterUrl: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=600&q=80",
    trailerId: "Y3W5O1Kx_D0"
  },
  {
    rank: 7,
    rankInten: "-1",
    title: "그녀가 죽었다",
    openDt: "2024-05-15",
    audiCnt: 42100,
    audiAcc: 1215400,
    director: "김세휘",
    actors: ["변요한", "신혜선", "이엘"],
    genre: "미스터리, 스릴러",
    showTm: "103분",
    synopsis: "남의 일상을 훔쳐보는 공인중개사 구정태와 거짓 관종 인플루언서 한소라. 관찰하던 중 한소라의 거실 소파에 싸늘한 시체가 되어 있는 그녀를 보게 된다! 범인으로 몰릴 위기에서 펼치는 자구책 사건.",
    rating: 8.3,
    posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    trailerId: "j6fHAnCg6vI"
  },
  {
    rank: 8,
    rankInten: "-2",
    title: "극장판 하이큐!! 쓰레기장의 결전",
    openDt: "2024-05-15",
    audiCnt: 32150,
    audiAcc: 720500,
    director: "미츠나카 스스무",
    actors: ["무라세 아유무", "이시카와 카이토"],
    genre: "애니메이션, 스포츠",
    showTm: "85분",
    synopsis: "'만년 1회전 탈락' 카라스노 고등학교와 '고양이 군단' 네코마 고등학교의 마침내 치러지는 공식 전면전. 숙명의 쓰레기장 결전이 막을 올린다!",
    rating: 9.3,
    posterUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80",
    trailerId: "E0T77Y5zZ0k"
  },
  {
    rank: 9,
    rankInten: "0",
    title: "청춘 18X2 너에게로 이어지는 길",
    openDt: "2024-05-22",
    audiCnt: 18400,
    audiAcc: 341200,
    director: "후지이 미치히토",
    actors: ["허광한", "키요하라 카야"],
    genre: "로맨스, 멜로",
    showTm: "124분",
    synopsis: "18년 전 대만 배낭여행 중 마주한 찬란한 첫사랑 아미와 지미. 36세가 된 지금, 옛 추억 카드를 들고 지미는 아미의 고향인 일본 전철 여행길을 오르게 되며 가슴 아픈 기억을 조우한다.",
    rating: 8.5,
    posterUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80",
    trailerId: "Wp0JorYAtq4"
  },
  {
    rank: 10,
    rankInten: "+1",
    title: "매드맥스: 분노의 질주",
    openDt: "2015-05-14",
    audiCnt: 11200,
    audiAcc: 3954000,
    director: "조지 밀러",
    actors: ["톰 하디", "샤를리즈 테론", "니콜라스 홀트"],
    genre: "액션, SF, 어드벤처",
    showTm: "120분",
    synopsis: "핵전쟁으로 황폐해진 22세기. 지배자 임모탄에 맞서 진정한 인류 생존의 존엄을 지키기 여전사 퓨리오사와 실향민 맥스가 벌이는 광기 넘치는 사막 질주 레이스.",
    rating: 9.5,
    posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80",
    trailerId: "hEJnMQG9pj8"
  }
];

// Initialize JSON Data Store Files
if (!fs.existsSync(REVIEWS_FILE)) {
  const defaultReviews = [
    {
      id: "rev-1",
      movieTitle: "범죄도시4",
      author: "영화매니아",
      rating: 5,
      content: "장은이 활약 정말 대단합니다! 통쾌한 마동석의 핵주먹은 여전히 영화관 사운드와 함께 느낄 때 카타르시스가 느껴지네요.",
      createdAt: "2026-06-04T12:00:00Z"
    },
    {
      id: "rev-2",
      movieTitle: "인사이드 아웃 2",
      author: "픽사덕후",
      rating: 5,
      content: "새로운 감정인 '불안이'가 우리 부모들과 사춘기 청소년들의 내면을 너무 세련되고 섬세하게 짚어내어 눈물 흘리고 가요.",
      createdAt: "2026-06-04T13:45:00Z"
    },
    {
      id: "rev-3",
      movieTitle: "파묘",
      author: "오컬트러버",
      rating: 4,
      content: "한국 정서를 오컬트 미스터리로 완벽하게 풀어낸 장재현 감독의 역작. 김고은 씨의 대살굿 연기는 진짜 소름 돋았습니다.",
      createdAt: "2026-06-04T14:10:00Z"
    }
  ];
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(defaultReviews, null, 2), "utf-8");
}

// 8 Major Korean Cinemas Spatial DB
const CINEMAS = [
  {
    id: "cgv-yongsan",
    name: "CGV 용산아이파크몰",
    brand: "CGV",
    address: "서울특별시 용산구 한강대로23길 55, 6층",
    lat: 37.5283,
    lng: 126.9641,
    phone: "1544-1122"
  },
  {
    id: "lotte-world",
    name: "롯데시네마 월드타워",
    brand: "Lotte",
    address: "서울특별시 송파구 올림픽로 300, 롯데월드몰 5-10층",
    lat: 37.5138,
    lng: 127.1040,
    phone: "1544-8855"
  },
  {
    id: "mega-coex",
    name: "메가박스 코엑스",
    brand: "Megabox",
    address: "서울특별시 강남구 영동대로 513, 지하1층",
    lat: 37.5126,
    lng: 127.0588,
    phone: "1544-0070"
  },
  {
    id: "cgv-yeongdeungpo",
    name: "CGV 영등포",
    brand: "CGV",
    address: "서울특별시 영등포구 영중로 15, 타임스퀘어 4층",
    lat: 37.5172,
    lng: 126.9030,
    phone: "1544-1122"
  },
  {
    id: "lotte-hongdae",
    name: "롯데시네마 홍대입구",
    brand: "Lotte",
    address: "서울특별시 마포구 양화로 176, 8층",
    lat: 37.5564,
    lng: 126.9242,
    phone: "1544-8855"
  },
  {
    id: "mega-seongsu",
    name: "메가박스 성수",
    brand: "Megabox",
    address: "서울특별시 성동구 왕십리로 83-21, 2층",
    lat: 37.5422,
    lng: 127.0450,
    phone: "1544-0070"
  },
  {
    id: "cgv-shinchon",
    name: "CGV 신촌아트레온",
    brand: "CGV",
    address: "서울특별시 서대문구 신촌로 129, 아트레온 빌딩",
    lat: 37.5567,
    lng: 126.9402,
    phone: "1544-1122"
  },
  {
    id: "mega-shinchon",
    name: "메가박스 신촌",
    brand: "Megabox",
    address: "서울특별시 서대문구 신촌역로 30, 밀리오레 5층",
    lat: 37.5599,
    lng: 126.9424,
    phone: "1544-0070"
  }
];

// Route: Get Cinemas Map Data
app.get("/api/theaters", (req, res) => {
  res.json(CINEMAS);
});

// Route: Get Active Box Office List (KOFIC API with fallback and caching)
app.get("/api/boxoffice", async (req, res) => {
  const yesterdayStr = getYesterdayDateString();

  // Try checking existing Cache File
  let cachedData: any = null;
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      // Cache valid for today only
      if (parsed.date === yesterdayStr) {
        cachedData = parsed.movies;
      }
    } catch (e) {
      console.error("Cache read error:", e);
    }
  }

  if (cachedData) {
    console.log("Serving box office from local cache.");
    return res.json(cachedData);
  }

  const koficKey = process.env.KOFIC_API_KEY || "f365135e7f2d47f2344d5a9878c1c022";
  const targetDt = yesterdayStr.replace(/-/g, "");

  try {
    console.log(`Querying KOFIC API for box office list for date: ${targetDt}...`);
    const koficUrl = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${koficKey}&targetDt=${targetDt}`;
    
    const koficRes = await fetch(koficUrl);
    if (!koficRes.ok) {
      throw new Error(`KOFIC API responded with status ${koficRes.status}`);
    }
    
    const koficData: any = await koficRes.json();
    const dailyList = koficData?.boxOfficeResult?.dailyBoxOfficeList;
    
    if (Array.isArray(dailyList) && dailyList.length > 0) {
      console.log(`Successfully fetched ${dailyList.length} movies from KOFIC API.`);
      
      // Fetch details in parallel with low timeout to prevent stalling
      const moviePromises = dailyList.map(async (item: any) => {
        const rank = parseInt(item.rank, 10);
        let rankInten = "0";
        if (item.rankOldAndNew === "NEW") {
          rankInten = "New";
        } else {
          const intensity = parseInt(item.rankInten, 10);
          if (intensity > 0) rankInten = `+${intensity}`;
          else if (intensity < 0) rankInten = `${intensity}`;
          else rankInten = "0";
        }
        
        const title = item.movieNm;
        const openDt = item.openDt || "2026-06-01";
        const audiCnt = parseInt(item.audiCnt, 10) || 0;
        const audiAcc = parseInt(item.audiAcc, 10) || 0;
        const movieCd = item.movieCd;
        
        // Initialize basic details
        let director = "";
        let actors: string[] = [];
        let genre = "";
        let showTm = "120분";
        
        // Detailed fetch from KOFIC searchMovieInfo
        try {
          const detailUrl = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${koficKey}&movieCd=${movieCd}`;
          // 2.5 second timeout on detail fetches so we don't stall the server
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          
          const detailRes = await fetch(detailUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (detailRes.ok) {
            const detailData: any = await detailRes.json();
            const movieInfo = detailData?.movieInfoResult?.movieInfo;
            if (movieInfo) {
              if (movieInfo.directors && movieInfo.directors.length > 0) {
                director = movieInfo.directors[0].peopleNm;
              }
              if (movieInfo.actors && movieInfo.actors.length > 0) {
                actors = movieInfo.actors.slice(0, 4).map((a: any) => a.peopleNm);
              }
              if (movieInfo.genres && movieInfo.genres.length > 0) {
                genre = movieInfo.genres.map((g: any) => g.genreNm).join(", ");
              }
              if (movieInfo.showTm) {
                showTm = `${movieInfo.showTm}분`;
              }
            }
          }
        } catch (detailErr) {
          console.warn(`Failed to fetch movie detail for ${title}:`, detailErr);
        }
        
        // Core fallback Unsplash images structured creatively for aesthetics
        const landscapeKeywords = [
          "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80", // Film can
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80", // Theater empty seats
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80", // Neon space
          "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80", // Mysterious smoke beam
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80", // Glowing internet wire
          "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=600&q=80", // Bright orange sky
          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80", // Flare bokeh
          "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80", // Red track sports
          "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80", // Vintage film bokeh
          "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&q=80"  // Deep shadow red background
        ];
        
        // Find if this is in our original default movies list to reuse premium visual details
        const defaultMatch = DEFAULT_MOVIES.find(
          dm => dm.title === title || title.includes(dm.title) || dm.title.includes(title)
        );
        
        let synopsis = "";
        let rating = 8.0;
        let posterUrl = "";
        let trailerId = "";
        
        if (defaultMatch) {
          synopsis = defaultMatch.synopsis;
          rating = defaultMatch.rating;
          posterUrl = defaultMatch.posterUrl;
          trailerId = defaultMatch.trailerId;
          if (!director) director = defaultMatch.director;
          if (actors.length === 0) actors = defaultMatch.actors;
          if (!genre) genre = defaultMatch.genre;
          if (showTm === "120분") showTm = defaultMatch.showTm;
        } else {
          // General fallback metadata if not matched
          const genreStr = genre || "";
          rating = parseFloat((7.8 + ((rank * 7) % 17) * 0.1).toFixed(1));
          if (rating > 9.8) rating = 9.2;
          
          if (genreStr.includes("액션") || genreStr.includes("범죄") || genreStr.includes("스릴러")) {
            synopsis = `강렬한 서사와 긴장감 넘치는 전개로 스크린을 장악하는 화제의 액션 스릴러 <${title}>. 압도적인 액션 시퀀스와 치밀한 심리 묘사가 결합되어 한순간도 눈을 뗄 수 없는 몰입감을 선사합니다.`;
            posterUrl = landscapeKeywords[0];
          } else if (genreStr.includes("공포") || genreStr.includes("미스터리") || genreStr.includes("오컬트")) {
            synopsis = `숨막히는 긴장감과 기묘한 사건으로 오감을 극대화하는 웰메이드 미스터리 <${title}>. 관객들의 상상력을 뒤흔들며 서서히 조여드는 서스펜스의 진수를 경험할 수 있는 기대작입니다.`;
            posterUrl = landscapeKeywords[3];
          } else if (genreStr.includes("애니메이션") || genreStr.includes("코미디") || genreStr.includes("가족")) {
            synopsis = `유쾌한 위트와 따뜻한 마음의 여운이 담긴 명품 힐링작 <${title}>. 기상천외한 연출과 통통 튀는 서사 연출로 남녀노소 누구나 웃으며 즐길 수 있는 특별한 즐거움을 전합니다.`;
            posterUrl = landscapeKeywords[1];
          } else if (genreStr.includes("SF") || genreStr.includes("판타지") || genreStr.includes("어드벤처")) {
            synopsis = `창의적인 비주얼과 감동으로 시공간을 초월하는 판타지 SF <${title}>. 미학적인 비주얼 아트워크와 함께 거대한 세계관 속 뜨거운 인간미를 고스란히 담아냈습니다.`;
            posterUrl = landscapeKeywords[2];
          } else {
            synopsis = `영화계를 향한 수많은 찬사 속에 극장가를 뜨겁게 달구고 있는 박스오피스 화제작 <${title}>. 완벽한 캐스팅 시너지와 흡입력 높은 서사로 흥행 열풍을 새롭게 이끌어가고 있습니다.`;
            posterUrl = landscapeKeywords[(rank * 3) % landscapeKeywords.length];
          }
          
          if (!director) director = "정보 미상";
          if (actors.length === 0) actors = ["조연 배우 컬렉션"];
          if (!genre) genre = "드라마, 일반";
          trailerId = ""; // Triggers client side smart trailer builder
        }
        
        return {
          rank,
          rankInten,
          title,
          openDt,
          audiCnt,
          audiAcc,
          director,
          actors,
          genre,
          showTm,
          synopsis,
          rating,
          posterUrl,
          trailerId
        };
      });
      
      const moviesList = await Promise.all(moviePromises);
      
      // Save output to Cache
      try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify({
          date: yesterdayStr,
          movies: moviesList
        }, null, 2), "utf-8");
      } catch (cacheWriteErr) {
        console.error("Cache writing error:", cacheWriteErr);
      }
      
      return res.json(moviesList);
    }
  } catch (err) {
    console.error("KOFIC API flow failed, falling back to local database:", err);
  }

  // Backup fallback to default movies
  res.json(DEFAULT_MOVIES);
});

// Route: Get Movie Reviews
app.get("/api/reviews", (req, res) => {
  try {
    const data = fs.readFileSync(REVIEWS_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: "Failed to read reviews database" });
  }
});

// Route: Submit Movie Review
app.post("/api/reviews", (req, res) => {
  const { movieTitle, author, rating, content } = req.body;

  if (!movieTitle || !author || !rating || !content) {
    return res.status(400).json({ error: "모든 리뷰란(영화 제목, 작성자, 별점, 내용)을 작성해 주세요." });
  }

  try {
    const data = fs.readFileSync(REVIEWS_FILE, "utf-8");
    const reviews = JSON.parse(data);

    const newReview = {
      id: "rev-" + Date.now(),
      movieTitle,
      author,
      rating: Number(rating),
      content,
      createdAt: new Date().toISOString()
    };

    reviews.unshift(newReview);
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf-8");

    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: "리뷰 저장과정에서 오동작이 발생했습니다." });
  }
});


// Express server Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Cinema Server] Operating securely at http://localhost:${PORT}`);
  });
}

startServer();
