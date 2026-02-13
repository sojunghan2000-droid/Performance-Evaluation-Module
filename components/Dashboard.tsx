import React, { useState, useMemo, useEffect } from 'react';
import EvaluationTable from './EvaluationTable';
import ComprehensiveTable from './ComprehensiveTable';
import { 
  Category, MetricConfig, MetricData, CalculatedMetric, EvaluationResult, 
  TaskEvaluationData, Assignee, Task, TaskType 
} from '../types';
import { generatePerformanceReview } from '../services/geminiService';
import { Sparkles, Calculator, AlertTriangle, FileText, User, Layers, Save, CheckCircle } from 'lucide-react';

// --- MOCK DATA ---

// 동적 평가 대상자 데이터 생성 (12명)
const ASSIGNEES: Assignee[] = [
  { id: 'user1', name: '김철수 책임', department: '기획팀' },
  { id: 'user2', name: '이영희 선임', department: '개발팀' },
  { id: 'user3', name: '박민수 주임', department: '디자인팀' },
  { id: 'user4', name: '최지은 대리', department: '마케팅팀' },
  { id: 'user5', name: '정현우 선임', department: 'QA팀' },
  { id: 'user6', name: '한소영 책임', department: '기획팀' },
  { id: 'user7', name: '윤도현 주임', department: '개발팀' },
  { id: 'user8', name: '강미라 대리', department: '운영팀' },
  { id: 'user9', name: '임성호 선임', department: '인프라팀' },
  { id: 'user10', name: '오수진 책임', department: '디자인팀' },
  { id: 'user11', name: '신동욱 주임', department: '개발팀' },
  { id: 'user12', name: '류하늘 대리', department: '기획팀' },
];

// 동적 평가 과제 데이터 생성 (담당자마다 3건씩, 기간별로 생성)
const generateTasks = (period: string): Task[] => {
  const tasks: Task[] = [];
  const [year, half] = period.split('-H');
  const periodLabel = `${year}년 ${half === '1' ? '상반기' : '하반기'}`;
  
  const planningTaskNames = [
    '신규 서비스 기획',
    '운영 프로세스 개선',
    '비즈니스 모델 설계',
    '고객 요구사항 분석',
    '시장 조사 및 분석',
    '전략 수립 및 실행 계획',
    '예산 계획 수립',
    '리소스 배분 계획',
    '리스크 관리 계획',
    '성과 지표 설계',
    '제품 로드맵 수립',
    '파트너십 전략 수립',
    '고객 여정 설계',
    '브랜드 포지셔닝 전략',
    '디지털 전환 계획',
    '고객 세그먼트 분석',
    '경쟁사 분석',
    '가격 전략 수립',
  ];
  const developmentTaskNames = [
    '백엔드 API 리팩토링',
    '결제 시스템 연동',
    '프론트엔드 UI 개선',
    '데이터베이스 최적화',
    '보안 강화 작업',
    '성능 개선 작업',
    '모바일 앱 개발',
    '마이크로서비스 구축',
    'CI/CD 파이프라인 구축',
    '모니터링 시스템 구축',
    '인증 시스템 개발',
    '실시간 알림 시스템',
    '데이터 시각화 대시보드',
    '검색 엔진 최적화',
    '캐싱 시스템 구축',
    '메시지 큐 시스템',
    '로깅 시스템 구축',
    '테스트 자동화 구축',
  ];

  let taskCounter = 0;
  ASSIGNEES.forEach((assignee, assigneeIndex) => {
    // 각 담당자마다 3건씩 생성 (PLANNING 2건, DEVELOPMENT 1건 또는 그 반대)
    const taskTypes: TaskType[] = assigneeIndex % 2 === 0 
      ? ['PLANNING', 'PLANNING', 'DEVELOPMENT']
      : ['PLANNING', 'DEVELOPMENT', 'DEVELOPMENT'];
    
    taskTypes.forEach((taskType) => {
      const taskNames = taskType === 'PLANNING' ? planningTaskNames : developmentTaskNames;
      const nameIndex = taskCounter % taskNames.length;
      
      tasks.push({
        id: `${period}-t${taskCounter + 1}`,
        assigneeId: assignee.id,
        name: `${periodLabel} ${taskNames[nameIndex]}`,
        type: taskType,
      });
      taskCounter++;
    });
  });

  return tasks;
};

// --- METRIC CONFIGS PER TASK TYPE ---
// 이미지 기준으로 통일된 평가 지표 구조 적용

const UNIFIED_METRICS: MetricConfig[] = [
  // 적정 계획 수립 (Appropriate Plan Establishment)
  {
    id: 'm1', 
    category: Category.PLANNING, 
    name: '계획의 구체성', 
    description: 'Lv.2 계획의 평균 기간', 
    weight: 20, 
    criteria: 'Task 당 Max 100일까지 가능하나 가급적 구체적 수립 권장 (100일 초과 5일 당 10점 감점, 150일 초과시 0점)', 
    inputUnit: '일', 
    placeholder: '평균 기간', 
    formatInput: (v) => `${v}일`,
    calculateScore: (days) => {
      if (days <= 100) return 100;
      if (days > 150) return 0;
      // 100일 초과 5일 당 10점 감점
      const excessDays = days - 100;
      const deduction = Math.floor(excessDays / 5) * 10;
      return Math.max(0, 100 - deduction);
    }
  },
  {
    id: 'm2', 
    category: Category.PLANNING, 
    name: '일정 변경 시기 준수율', 
    description: '계획 종료일 이후 일정 변경 건수', 
    weight: 20, 
    criteria: '계획 종료일 이후 일정 변경 건수 당 -10점 (계획 종료일 이후 일정 변경 10건 이상 = 0점)', 
    inputUnit: '건', 
    placeholder: '변경 건수', 
    formatInput: (v) => `${v}건`,
    calculateScore: (count) => {
      if (count >= 10) return 0;
      return Math.max(0, 100 - (count * 10));
    }
  },
  // 적정 업무 운영 (Appropriate Work Operation)
  {
    id: 'm3', 
    category: Category.OPERATION, 
    name: '착수 준수율', 
    description: '담당 과제 중 기한 내 착수한 비율', 
    weight: 20, 
    criteria: '준수율 = 점수', 
    inputUnit: '%', 
    placeholder: '준수율', 
    formatInput: (v) => `${v}%`,
    calculateScore: (rate) => Math.max(0, Math.min(100, rate))
  },
  {
    id: 'm4', 
    category: Category.OPERATION, 
    name: '마감 준수율', 
    description: '담당 과제 중 기한 내 완료한 비율', 
    weight: 20, 
    criteria: '준수율 = 점수', 
    inputUnit: '%', 
    placeholder: '준수율', 
    formatInput: (v) => `${v}%`,
    calculateScore: (rate) => Math.max(0, Math.min(100, rate))
  },
  {
    id: 'm5', 
    category: Category.OPERATION, 
    name: '지연일수', 
    description: '지연된 과제들의 지연 기간', 
    weight: 20, 
    criteria: '지연일수 당 -1점 (지연일수 상한선 100일, 100일 이상 = 0점)', 
    inputUnit: '일', 
    placeholder: '지연일수', 
    formatInput: (v) => `${v}일`,
    calculateScore: (days) => {
      if (days >= 100) return 0;
      return Math.max(0, 100 - days);
    }
  }
];

const getConfigs = (type: TaskType) => UNIFIED_METRICS;

// --- MAIN COMPONENT ---

interface DashboardProps {
  period: string;
}

const Dashboard: React.FC<DashboardProps> = ({ period }) => {
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(ASSIGNEES[0].id);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('COMPREHENSIVE'); // 'COMPREHENSIVE' or taskId
  
  // Store all evaluation data in a single state object: { [period-taskId]: data }
  const [allData, setAllData] = useState<Record<string, TaskEvaluationData>>({});
  
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // localStorage에서 저장된 데이터 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem('evaluationData');
      if (saved) {
        setAllData(JSON.parse(saved));
      }
    } catch (e) {
      console.error('저장된 데이터 불러오기 실패:', e);
    }
  }, []);

  // 저장 핸들러
  const handleSave = () => {
    try {
      localStorage.setItem('evaluationData', JSON.stringify(allData));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error('데이터 저장 실패:', e);
      alert('데이터 저장에 실패했습니다.');
    }
  };

  // Generate tasks for current period
  const tasksForPeriod = useMemo(() => generateTasks(period), [period]);

  // Filter tasks for current assignee and period
  const currentTasks = useMemo(() => 
    tasksForPeriod.filter(t => t.assigneeId === selectedAssigneeId), 
  [tasksForPeriod, selectedAssigneeId]);

  // Reset task selection when assignee or period changes
  useEffect(() => {
    setSelectedTaskId('COMPREHENSIVE');
    setGeminiAnalysis(null);
  }, [selectedAssigneeId, period]);

  // Initialize data for new tasks if not exists (period별로 분리)
  useEffect(() => {
    setAllData(prev => {
      const newData = { ...prev };
      currentTasks.forEach(task => {
        const dataKey = `${period}-${task.id}`;
        if (!newData[dataKey]) {
          const configs = getConfigs(task.type);
          const initialMetrics: Record<string, MetricData> = {};
          configs.forEach(c => {
            initialMetrics[c.id] = { configId: c.id, inputValue: 0 };
          });
          
          // Pre-fill some mock data for better UX demonstration (이미지 예시 기준)
          // 기간별로 약간 다른 초기값 설정 (시뮬레이션)
          const periodVariation = period.includes('H1') ? 0 : 5;
          initialMetrics['m1'].inputValue = 100 - periodVariation; // 계획의 구체성: ~100일
          initialMetrics['m2'].inputValue = 3 + (periodVariation > 0 ? 1 : 0);   // 일정 변경 시기 준수율
          initialMetrics['m3'].inputValue = 90 - periodVariation;  // 착수 준수율: 90%
          initialMetrics['m4'].inputValue = 90 - periodVariation; // 마감 준수율: 90%
          initialMetrics['m5'].inputValue = 10 + periodVariation; // 지연일수: 10일

          newData[dataKey] = {
            metrics: initialMetrics,
            qualitativeScore: 80 - periodVariation, // Default start
            qualitativeOpinion: ''
          };
        }
      });
      return newData;
    });
  }, [currentTasks, period]);

  // Handlers for input changes (period별 key 사용)
  const handleInputChange = (taskId: string, metricId: string, value: number) => {
    const dataKey = `${period}-${taskId}`;
    setAllData(prev => ({
      ...prev,
      [dataKey]: {
        ...prev[dataKey],
        metrics: {
          ...prev[dataKey].metrics,
          [metricId]: { ...prev[dataKey].metrics[metricId], inputValue: value }
        }
      }
    }));
    setGeminiAnalysis(null);
  };

  const handleQualitativeChange = (taskId: string, score: number) => {
    const dataKey = `${period}-${taskId}`;
    setAllData(prev => ({
      ...prev,
      [dataKey]: { ...prev[dataKey], qualitativeScore: score }
    }));
    setGeminiAnalysis(null);
  };

  const handleOpinionChange = (taskId: string, text: string) => {
    const dataKey = `${period}-${taskId}`;
    setAllData(prev => ({
      ...prev,
      [dataKey]: { ...prev[dataKey], qualitativeOpinion: text }
    }));
  };

  // Calculation Logic (period별 key 사용)
  const getTaskResult = (task: Task): EvaluationResult => {
    const dataKey = `${period}-${task.id}`;
    const data = allData[dataKey];
    if (!data) {
        // Fallback for initial render before effect runs
        return { quantTotalWeighted: 0, quantConverted: 0, qualConverted: 0, finalScore: 0, grade: 'C', breakdown: [] };
    }
    
    const configs = getConfigs(task.type);
    const breakdown = configs.map(config => {
      const metricData = data.metrics[config.id] || { inputValue: 0 };
      const rawScore = config.calculateScore(metricData.inputValue);
      const weightedScore = rawScore * (config.weight / 100);
      return { config, inputValue: metricData.inputValue, rawScore, weightedScore };
    });

    const quantTotalWeighted = breakdown.reduce((sum, item) => sum + item.weightedScore, 0);
    const quantConverted = quantTotalWeighted * 0.7;
    const qualConverted = data.qualitativeScore * 0.3;
    const finalScore = quantConverted + qualConverted;
    
    let grade = 'C';
    if (finalScore >= 90) grade = 'S';
    else if (finalScore >= 80) grade = 'A';
    else if (finalScore >= 70) grade = 'B';

    return {
      quantTotalWeighted,
      quantConverted,
      qualConverted,
      finalScore,
      grade,
      breakdown,
      qualitativeOpinion: data.qualitativeOpinion
    };
  };

  const evaluationResult: EvaluationResult = useMemo(() => {
    if (selectedTaskId !== 'COMPREHENSIVE') {
      const task = currentTasks.find(t => t.id === selectedTaskId);
      if (task) return getTaskResult(task);
    }

    // Comprehensive Calculation
    const taskResults = currentTasks.map(t => ({ task: t, result: getTaskResult(t) }));
    if (taskResults.length === 0) return { quantTotalWeighted: 0, quantConverted: 0, qualConverted: 0, finalScore: 0, grade: 'C', breakdown: [] };

    const avgQuantConverted = taskResults.reduce((acc, curr) => acc + curr.result.quantConverted, 0) / taskResults.length;
    const avgQualConverted = taskResults.reduce((acc, curr) => acc + curr.result.qualConverted, 0) / taskResults.length;
    const avgFinalScore = avgQuantConverted + avgQualConverted;
    
    let grade = 'C';
    if (avgFinalScore >= 90) grade = 'S';
    else if (avgFinalScore >= 80) grade = 'A';
    else if (avgFinalScore >= 70) grade = 'B';

    return {
      quantTotalWeighted: 0, // Not applicable for average
      quantConverted: avgQuantConverted,
      qualConverted: avgQualConverted,
      finalScore: avgFinalScore,
      grade,
      breakdown: [], // Not used in comprehensive view
      isComprehensive: true,
      taskSummaries: taskResults.map(tr => ({
        taskId: tr.task.id,
        taskName: tr.task.name,
        finalScore: tr.result.finalScore,
        quantConverted: tr.result.quantConverted,
        qualConverted: tr.result.qualConverted
      }))
    };
  }, [selectedTaskId, selectedAssigneeId, allData, currentTasks]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const feedback = await generatePerformanceReview(evaluationResult);
    setGeminiAnalysis(feedback);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      {/* SELECTION AREA (RED BOX REPLACEMENT) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 items-end md:items-center">
        <div className="flex-1 w-full">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            평가 대상자 (담당자)
          </label>
          <select 
            value={selectedAssigneeId}
            onChange={(e) => setSelectedAssigneeId(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-gray-50"
          >
            {ASSIGNEES.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.department})</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 w-full">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            평가 과제 (Task Lv.1)
          </label>
          <select 
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-gray-50"
          >
            <option value="COMPREHENSIVE" className="font-bold text-blue-700">📌 종합 평가 (전체 과제 평균)</option>
            <optgroup label="개별 과제 선택">
              {currentTasks.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.type === 'PLANNING' ? '기획' : '개발'})</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* SCORE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">
              {evaluationResult.isComprehensive ? '평균 정량 점수' : '정량 평가 점수'} (70점 만점)
            </h3>
            <Calculator className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">{evaluationResult.quantConverted.toFixed(1)}</span>
            <span className="ml-2 text-sm text-gray-500">/ 70</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">
               {evaluationResult.isComprehensive ? '평균 정성 점수' : '정성 평가 점수'} (30점 만점)
            </h3>
            <FileText className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">{evaluationResult.qualConverted.toFixed(1)}</span>
            <span className="ml-2 text-sm text-gray-500">/ 30</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">
               {evaluationResult.isComprehensive ? '종합 평균 점수' : '최종 평가 점수'}
            </h3>
            <Sparkles className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex items-baseline">
            <span className="text-4xl font-black text-gray-900">{evaluationResult.finalScore.toFixed(1)}</span>
            <span className="ml-2 text-sm text-gray-500">/ 100</span>
          </div>
        </div>
      </div>

      {/* CONDITIONAL TABLE RENDER */}
      <section>
        {evaluationResult.isComprehensive ? (
          <>
            <div className="mb-4 flex items-center justify-end">
              <button
                onClick={handleSave}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
                  isSaved
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    저장 완료
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </>
                )}
              </button>
            </div>
            <ComprehensiveTable
              taskSummaries={evaluationResult.taskSummaries || []}
              onTaskClick={(taskId) => setSelectedTaskId(taskId)}
            />
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-700">
                  {currentTasks.find(t => t.id === selectedTaskId)?.type === 'PLANNING' ? '기획' : '개발'}
                </span>
                상세 평가 지표: {currentTasks.find(t => t.id === selectedTaskId)?.name}
              </h2>
              <button
                onClick={handleSave}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
                  isSaved
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    저장 완료
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </>
                )}
              </button>
            </div>
            <EvaluationTable 
              calculatedMetrics={evaluationResult.breakdown} 
              onInputChange={(id, val) => handleInputChange(selectedTaskId, id, val)}
              qualitativeScore={allData[`${period}-${selectedTaskId}`]?.qualitativeScore || 0}
              onQualitativeChange={(val) => handleQualitativeChange(selectedTaskId, val)}
              qualitativeOpinion={allData[`${period}-${selectedTaskId}`]?.qualitativeOpinion || ''}
              onOpinionChange={(val) => handleOpinionChange(selectedTaskId, val)}
            />
          </>
        )}
      </section>

      {/* AI Analysis */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            AI 성과 분석 ({selectedTaskId === 'COMPREHENSIVE' ? '종합' : '개별 과제'})
          </h3>
          {!geminiAnalysis && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAnalyzing ? '분석 중...' : '분석 결과 생성'}
            </button>
          )}
        </div>
        
        <div className="flex-1 bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed overflow-y-auto max-h-64 min-h-[160px]">
          {geminiAnalysis ? (
            <div className="prose prose-sm max-w-none whitespace-pre-line">
              {geminiAnalysis}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              {isAnalyzing ? (
                <div className="flex flex-col items-center animate-pulse">
                  <div className="w-8 h-8 bg-indigo-200 rounded-full mb-2"></div>
                  <span>데이터를 분석하고 있습니다...</span>
                </div>
              ) : (
                <>
                  <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                  <p>상단 버튼을 눌러 {selectedTaskId === 'COMPREHENSIVE' ? '종합' : '과제별'} AI 피드백을 받아보세요.</p>
                </>
              )}
            </div>
          )}
        </div>
        {geminiAnalysis && (
           <div className="mt-4 text-right">
              <button 
                onClick={() => setGeminiAnalysis(null)}
                className="text-xs text-gray-500 underline hover:text-indigo-600"
              >
                결과 초기화
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;