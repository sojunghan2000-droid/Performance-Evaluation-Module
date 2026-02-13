import React from 'react';
import { EvaluationResult } from '../types';
import { Sparkles } from 'lucide-react';

interface ComprehensiveTableProps {
  taskSummaries: NonNullable<EvaluationResult['taskSummaries']>;
  onTaskClick?: (taskId: string) => void;
}

const ComprehensiveTable: React.FC<ComprehensiveTableProps> = ({ taskSummaries, onTaskClick }) => {
  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm bg-white">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900">과제별 종합 평가 현황</h3>
          <p className="text-xs text-gray-500 mt-1">담당자의 모든 과제(Task Lv.1)에 대한 평가 점수 요약입니다.</p>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/3">
              과제명 (Task Lv.1)
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
              정량 평가(70)
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
              정성 평가(30)
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
              최종 점수
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {taskSummaries.map((task, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td
                className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-700 cursor-pointer hover:text-blue-900 hover:underline"
                onClick={() => onTaskClick?.(task.taskId)}
              >
                {task.taskName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                {task.quantConverted.toFixed(1)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                {task.qualConverted.toFixed(1)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                {task.finalScore.toFixed(1)}
              </td>
            </tr>
          ))}
          {taskSummaries.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                평가 대상 과제가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot className="bg-gray-50 border-t border-gray-200">
          <tr>
             <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
               전체 평균
             </td>
             <td className="px-6 py-4 text-center font-bold text-blue-700">
               {(taskSummaries.reduce((a, b) => a + b.quantConverted, 0) / (taskSummaries.length || 1)).toFixed(1)}
             </td>
             <td className="px-6 py-4 text-center font-bold text-purple-700">
               {(taskSummaries.reduce((a, b) => a + b.qualConverted, 0) / (taskSummaries.length || 1)).toFixed(1)}
             </td>
             <td className="px-6 py-4 text-center font-black text-gray-900 text-lg">
               {(taskSummaries.reduce((a, b) => a + b.finalScore, 0) / (taskSummaries.length || 1)).toFixed(1)}
             </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ComprehensiveTable;