import { GoogleGenAI } from "@google/genai";
import { EvaluationResult } from "../types";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const generatePerformanceReview = async (result: EvaluationResult): Promise<string> => {
  if (!GEMINI_API_KEY) {
    console.warn("Gemini API Key is missing.");
    return "API 키가 설정되지 않아 AI 분석을 사용할 수 없습니다.";
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Prepare data for the prompt
  const breakdownText = result.breakdown.map(m => 
    `- ${m.config.name} (${m.config.category}): 입력값 ${m.inputValue}${m.config.inputUnit}, 점수 ${m.rawScore}점 (가중치 반영: ${m.weightedScore}점)`
  ).join('\n');

  const opinionText = result.qualitativeOpinion 
    ? `\n[평가자 의견]\n"${result.qualitativeOpinion}"\n` 
    : '';

  const prompt = `
    당신은 꼼꼼하고 공정한 인사 평가 전문가입니다.
    다음은 한 직원의 성과 평가 데이터입니다. 이 데이터를 바탕으로 다음 내용을 포함한 300자 내외의 종합 피드백을 작성해주세요.

    1. 정량 평가 결과 요약 (강점과 약점 분석)
    2. 정성 평가 및 평가자 의견 반영
    3. 현재 점수(${result.finalScore.toFixed(1)}점)에 대한 해석
    4. 향후 성과 향상을 위한 구체적인 조언

    [평가 데이터]
    - 정량 평가 환산 점수 (70점 만점): ${result.quantConverted.toFixed(1)}점
    - 정성 평가 환산 점수 (30점 만점): ${result.qualConverted.toFixed(1)}점
    - 최종 합계: ${result.finalScore.toFixed(1)}점

    ${opinionText}

    [상세 지표]
    ${breakdownText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Fast response for UI
      }
    });

    return response.text || "분석 결과를 생성하지 못했습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};