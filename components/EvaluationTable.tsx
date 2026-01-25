import React from 'react';
import { Category, MetricConfig, MetricData, CalculatedMetric } from '../types';
import { HelpCircle, AlertCircle } from 'lucide-react';

interface EvaluationTableProps {
  calculatedMetrics: CalculatedMetric[];
  onInputChange: (id: string, value: number) => void;
  qualitativeScore: number;
  onQualitativeChange: (value: number) => void;
  qualitativeOpinion: string;
  onOpinionChange: (value: string) => void;
}

const EvaluationTable: React.FC<EvaluationTableProps> = ({
  calculatedMetrics,
  onInputChange,
  qualitativeScore,
  onQualitativeChange,
  qualitativeOpinion,
  onOpinionChange,
}) => {
  
  // Group metrics by category for rowspan logic
  const planningMetrics = calculatedMetrics.filter(m => m.config.category === Category.PLANNING);
  const operationMetrics = calculatedMetrics.filter(m => m.config.category === Category.OPERATION);

  const renderMetricRow = (item: CalculatedMetric, index: number, totalInGroup: number, isFirst: boolean) => {
    return (
      <tr key={item.config.id} className="hover:bg-gray-50 transition-colors">
        {isFirst && (
          <td
            rowSpan={totalInGroup}
            className="px-4 py-4 text-sm font-bold text-gray-900 bg-gray-50 border-r border-gray-200 text-center align-middle"
          >
            {item.config.category}
            <div className="text-xs font-normal text-gray-500 mt-1">
               {item.config.category === Category.PLANNING ? '계획 단계' : '실행 단계'}
            </div>
          </td>
        )}
        <td className="px-4 py-3 border-r border-gray-200">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{item.config.name}</span>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {item.config.description}
                <div className="mt-1 text-gray-300 border-t border-gray-600 pt-1">
                  기준: {item.config.criteria}
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">{item.config.description}</div>
        </td>
        <td className="px-4 py-3 text-center border-r border-gray-200 text-sm font-medium text-gray-600">
          {item.config.weight}%
        </td>
        <td className="px-4 py-3 border-r border-gray-200 bg-white">
          <div className="text-xs text-gray-500 mb-1">{item.config.criteria}</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={item.inputValue === 0 ? '' : item.inputValue}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  onInputChange(item.config.id, 0);
                } else {
                  onInputChange(item.config.id, parseFloat(val) || 0);
                }
              }}
              onFocus={(e) => {
                if (e.target.value === '0') {
                  e.target.select();
                }
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-1.5 px-2 border"
              placeholder={item.config.placeholder}
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">{item.config.inputUnit}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-center border-r border-gray-200 font-semibold text-blue-700 bg-blue-50/30">
          {item.rawScore}점
        </td>
        <td className="px-4 py-3 text-center font-bold text-gray-900 bg-gray-50/50">
          {item.weightedScore.toFixed(1)}
        </td>
      </tr>
    );
  };

  const totalWeighted = calculatedMetrics.reduce((acc, curr) => acc + curr.weightedScore, 0);
  const totalConverted = totalWeighted * 0.7;

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-32">
                구분
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                정량 평가 지표 (Task Lv.2 기준)
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-20">
                가중치
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-64">
                점수 계산 기준 및 입력
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-24">
                환산 점수
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                가중치<br/>반영 점수
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {planningMetrics.map((m, idx) => renderMetricRow(m, idx, planningMetrics.length, idx === 0))}
            {operationMetrics.map((m, idx) => renderMetricRow(m, idx, operationMetrics.length, idx === 0))}
            
            {/* Summary Row for Quantitative */}
            <tr className="bg-blue-50 border-t-2 border-blue-100">
              <td colSpan={2} className="px-4 py-4 text-right font-bold text-gray-700 border-r border-blue-200">
                정량 평가 합계 (70점 만점 환산)
              </td>
              <td className="px-4 py-4 text-center font-bold text-gray-700 border-r border-blue-200">70%</td>
              <td className="px-4 py-4 border-r border-blue-200"></td>
              <td className="px-4 py-4 text-center text-gray-500 border-r border-blue-200">-</td>
              <td className="px-4 py-4 text-center font-black text-blue-700 text-lg">
                {totalConverted.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Qualitative Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-t border-gray-200">
        <div className="p-4 bg-gray-50 border-r border-gray-200 flex flex-col justify-center">
          <h3 className="font-bold text-gray-900">정성 평가</h3>
          <p className="text-xs text-gray-500 mt-1">계획 구체성, 업무 태도, 기여도, 산출물 품질</p>
        </div>
        
        <div className="p-4 md:col-span-2 border-r border-gray-200 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              점수 입력 (0 ~ 100점)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="100"
                value={qualitativeScore === 0 ? '' : qualitativeScore}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    onQualitativeChange(0);
                  } else {
                    let numVal = parseInt(val) || 0;
                    if (numVal > 100) numVal = 100;
                    if (numVal < 0) numVal = 0;
                    onQualitativeChange(numVal);
                  }
                }}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.select();
                  }
                }}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
              />
              <span className="text-sm text-gray-500">
                / 100점
              </span>
            </div>
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               평가자 의견
             </label>
             <textarea
               rows={3}
               value={qualitativeOpinion}
               onChange={(e) => onOpinionChange(e.target.value)}
               className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
               placeholder="피평가자의 강점, 보완점 등 정성적인 의견을 자유롭게 기술해주세요."
             />
          </div>
        </div>

        <div className="p-4 bg-purple-50 flex flex-col items-center justify-center">
          <span className="text-xs font-semibold text-purple-700 uppercase">30점 만점 환산</span>
          <span className="text-2xl font-black text-purple-800 mt-1">
            {(qualitativeScore * 0.3).toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EvaluationTable;