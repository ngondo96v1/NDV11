
import { GoogleGenAI } from "@google/genai";

// Financial advisor service using Gemini API with standardized initialization
export const getFinancialAdvice = async (amount: number, term: number, income?: number, retries = 2) => {
  // Directly access the pre-configured environment variable
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "Tính năng tư vấn tài chính đang được đồng bộ. Vui lòng thử lại sau ít phút.";
  }

  // Use named parameter for initialization with direct access to process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const attempt = async (remainingRetries: number): Promise<string> => {
    try {
      // Use gemini-3-pro-preview for complex reasoning task (financial analysis)
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Tôi muốn vay ${amount.toLocaleString()} VNĐ trong vòng ${term} tháng. Thu nhập của tôi là ${income ? income.toLocaleString() : 'không xác định'} VNĐ. Hãy phân tích khả năng trả nợ và đưa ra lời khuyên tài chính cực kỳ ngắn gọn (dưới 50 từ) bằng tiếng Việt.`,
        config: {
          systemInstruction: "Bạn là chuyên gia tài chính của hệ thống NDV Money. Trả lời chuyên nghiệp, súc tích, tập trung vào giải pháp thanh toán.",
          temperature: 0.7,
        },
      });

      // Directly access .text property from GenerateContentResponse (not a method)
      return response.text || "Hiện tại chuyên gia chưa có lời khuyên cụ thể cho khoản vay này.";
    } catch (error) {
      if (remainingRetries > 0) {
        // Exponential backoff for reliability
        await new Promise(resolve => setTimeout(resolve, 1000 * (3 - remainingRetries)));
        return attempt(remainingRetries - 1);
      }
      console.error("Gemini API Error:", error);
      return "Dịch vụ tư vấn AI đang bận xử lý dữ liệu. Vui lòng kiểm tra lại sau.";
    }
  };

  return attempt(retries);
};
