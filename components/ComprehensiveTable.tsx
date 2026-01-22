import React from 'react';
import { EvaluationResult } from '../types';
import { Sparkles } from 'lucide-react';

interface ComprehensiveTableProps {
  taskSummaries: NonNullable<EvaluationResult['taskSummaries']>;
}

const ComprehensiveTable: React.FC<ComprehensiveTableProps> = ({ taskSummaries }) => {
  const getGrade = (score: number) => {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    return 'C';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

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
            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
              등급
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {taskSummaries.map((task, idx) => {
            const grade = getGrade(task.finalScore);
            return (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(grade)}`}>
                    {grade}
                  </span>
                </td>
              </tr>
            );
          })}
          {taskSummaries.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
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
             <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ComprehensiveTable;