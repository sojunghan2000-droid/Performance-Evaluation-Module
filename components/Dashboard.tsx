import React, { useState, useMemo, useEffect } from 'react';
import EvaluationTable from './EvaluationTable';
import ComprehensiveTable from './ComprehensiveTable';
import { 
  Category, MetricConfig, MetricData, CalculatedMetric, EvaluationResult, 
  TaskEvaluationData, Assignee, Task, TaskType 
} from '../types';
import { generatePerformanceReview } from '../services/geminiService';
import { Sparkles, Calculator, AlertTriangle, FileText, User, Layers } from 'lucide-react';

// --- MOCK DATA ---

const ASSIGNEES: Assignee[] = [
  { id: 'user1', name: '김철수 책임', department: '기획팀' },
  { id: 'user2', name: '이영희 선임', department: '개발팀' },
];

const TASKS: Task[] = [
  { id: 't1', assigneeId: 'user1', name: '2025 신규 서비스 기획', type: 'PLANNING' },
  { id: 't2', assigneeId: 'user1', name: '운영 프로세스 개선', type: 'PLANNING' },
  { id: 't3', assigneeId: 'user2', name: '백엔드 API 리팩토링', type: 'DEVELOPMENT' },
  { id: 't4', assigneeId: 'user2', name: '결제 시스템 연동', type: 'DEVELOPMENT' },
];

// --- METRIC CONFIGS PER TASK TYPE ---

const PLANNING_METRICS: MetricConfig[] = [
  {
    id: 'p1', category: Category.PLANNING, name: '계획의 구체성', description: 'Lv.2 계획의 평균 기간', weight: 20, criteria: '2주 이내: 100, ~4주: 80, ~6주: 60', inputUnit: '일', placeholder: '기간', formatInput: (v) => `${v}일`,
    calculateScore: (days) => days <= 14 ? 100 : days <= 28 ? 80 : days <= 42 ? 60 : 40
  },
  {
    id: 'p2', category: Category.PLANNING, name: '산출 효율성', description: '계획 MH 대비 실적 MH', weight: 20, criteria: '100 - (실적/계획%)', inputUnit: '%', placeholder: '비율', formatInput: (v) => `${v}%`,
    calculateScore: (r) => 100 - r
  },
  {
    id: 'p3', category: Category.OPERATION, name: '마감 준수율', description: '기한 내 완료 비율', weight: 30, criteria: '준수율 = 점수', inputUnit: '%', placeholder: '준수율', formatInput: (v) => `${v}%`,
    calculateScore: (p) => Math.min(100, p)
  },
  {
    id: 'p4', category: Category.OPERATION, name: '지연 일수', description: '총 지연 기간', weight: 30, criteria: '일수 x 5 감점', inputUnit: '일', placeholder: '지연일', formatInput: (v) => `${v}일`,
    calculateScore: (d) => Math.max(-100, -(d * 5))
  }
];

const DEV_METRICS: MetricConfig[] = [
  {
    id: 'd1', category: Category.PLANNING, name: '요구사항 분석', description: '기능 명세서 작성 완료율', weight: 20, criteria: '완료율 = 점수', inputUnit: '%', placeholder: '완료율', formatInput: (v) => `${v}%`,
    calculateScore: (p) => Math.min(100, p)
  },
  {
    id: 'd2', category: Category.OPERATION, name: '코드 리뷰 참여', description: 'PR 리뷰 건수', weight: 20, criteria: '10건↑: 100, 5건↑: 80', inputUnit: '건', placeholder: '리뷰 수', formatInput: (v) => `${v}건`,
    calculateScore: (c) => c >= 10 ? 100 : c >= 5 ? 80 : c >= 3 ? 60 : 40
  },
  {
    id: 'd3', category: Category.QUALITY, name: '버그 발생률', description: '테스트 단계 버그 수', weight: 30, criteria: '0건: 100, 1건당 -10', inputUnit: '건', placeholder: '버그 수', formatInput: (v) => `${v}건`,
    calculateScore: (c) => Math.max(0, 100 - (c * 10))
  },
  {
    id: 'd4', category: Category.OPERATION, name: '배포 일정 준수', description: 'Target Date 준수 여부', weight: 30, criteria: '준수: 100, 지연: 50', inputUnit: '지연일', placeholder: '지연일', formatInput: (v) => `${v}일`,
    calculateScore: (d) => d === 0 ? 100 : d <= 2 ? 80 : 50
  }
];

const getConfigs = (type: TaskType) => type === 'PLANNING' ? PLANNING_METRICS : DEV_METRICS;

// --- MAIN COMPONENT ---

const Dashboard: React.FC = () => {
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(ASSIGNEES[0].id);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('COMPREHENSIVE'); // 'COMPREHENSIVE' or taskId
  
  // Store all evaluation data in a single state object: { [taskId]: data }
  const [allData, setAllData] = useState<Record<string, TaskEvaluationData>>({});
  
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filter tasks for current assignee
  const currentTasks = useMemo(() => 
    TASKS.filter(t => t.assigneeId === selectedAssigneeId), 
  [selectedAssigneeId]);

  // Reset task selection when assignee changes
  useEffect(() => {
    setSelectedTaskId('COMPREHENSIVE');
  }, [selectedAssigneeId]);

  // Initialize data for new tasks if not exists
  useEffect(() => {
    setAllData(prev => {
      const newData = { ...prev };
      currentTasks.forEach(task => {
        if (!newData[task.id]) {
          const configs = getConfigs(task.type);
          const initialMetrics: Record<string, MetricData> = {};
          configs.forEach(c => {
            initialMetrics[c.id] = { configId: c.id, inputValue: 0 };
          });
          
          // Pre-fill some mock data for better UX demonstration
          if (task.type === 'PLANNING') {
             initialMetrics['p1'].inputValue = 10; 
             initialMetrics['p2'].inputValue = 90;
             initialMetrics['p3'].inputValue = 100;
             initialMetrics['p4'].inputValue = 0;
          } else {
             initialMetrics['d1'].inputValue = 100;
             initialMetrics['d2'].inputValue = 12;
             initialMetrics['d3'].inputValue = 2;
             initialMetrics['d4'].inputValue = 0;
          }

          newData[task.id] = {
            metrics: initialMetrics,
            qualitativeScore: 80, // Default start
            qualitativeOpinion: ''
          };
        }
      });
      return newData;
    });
  }, [currentTasks]);

  // Handlers for input changes
  const handleInputChange = (taskId: string, metricId: string, value: number) => {
    setAllData(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        metrics: {
          ...prev[taskId].metrics,
          [metricId]: { ...prev[taskId].metrics[metricId], inputValue: value }
        }
      }
    }));
    setGeminiAnalysis(null);
  };

  const handleQualitativeChange = (taskId: string, score: number) => {
    setAllData(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], qualitativeScore: score }
    }));
    setGeminiAnalysis(null);
  };

  const handleOpinionChange = (taskId: string, text: string) => {
    setAllData(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], qualitativeOpinion: text }
    }));
  };

  // Calculation Logic
  const getTaskResult = (task: Task): EvaluationResult => {
    const data = allData[task.id];
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
          <div className={`absolute right-0 top-0 h-full w-2 ${
             evaluationResult.grade === 'S' ? 'bg-green-500' : 
             evaluationResult.grade === 'A' ? 'bg-blue-500' :
             evaluationResult.grade === 'B' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">
               {evaluationResult.isComprehensive ? '종합 평균 점수' : '최종 평가 등급 점수'}
            </h3>
            <Sparkles className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex items-baseline">
            <span className="text-4xl font-black text-gray-900">{evaluationResult.finalScore.toFixed(1)}</span>
            <span className="ml-2 text-sm text-gray-500">/ 100</span>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              evaluationResult.grade === 'S' ? 'bg-green-100 text-green-800' :
              evaluationResult.grade === 'A' ? 'bg-blue-100 text-blue-800' :
              evaluationResult.grade === 'B' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {evaluationResult.grade} ({
                evaluationResult.grade === 'S' ? '탁월' :
                evaluationResult.grade === 'A' ? '우수' :
                evaluationResult.grade === 'B' ? '보통' : '미흡'
              })
            </span>
          </div>
        </div>
      </div>

      {/* CONDITIONAL TABLE RENDER */}
      <section>
        {evaluationResult.isComprehensive ? (
          <ComprehensiveTable taskSummaries={evaluationResult.taskSummaries || []} />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-700">
                  {TASKS.find(t => t.id === selectedTaskId)?.type === 'PLANNING' ? '기획' : '개발'}
                </span>
                상세 평가 지표: {TASKS.find(t => t.id === selectedTaskId)?.name}
              </h2>
              <span className="text-sm text-gray-500">* 항목 입력 시 점수가 자동 저장됩니다.</span>
            </div>
            <EvaluationTable 
              calculatedMetrics={evaluationResult.breakdown} 
              onInputChange={(id, val) => handleInputChange(selectedTaskId, id, val)}
              qualitativeScore={allData[selectedTaskId]?.qualitativeScore || 0}
              onQualitativeChange={(val) => handleQualitativeChange(selectedTaskId, val)}
              qualitativeOpinion={allData[selectedTaskId]?.qualitativeOpinion || ''}
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