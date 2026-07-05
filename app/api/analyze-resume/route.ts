import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription, fileData } = await req.json();

    if (!resumeText && !fileData) {
      return NextResponse.json({ error: "Resume text or file is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // If no API key is present, provide a mock response for demonstration
    if (!apiKey) {
      // Mocked response for demo purposes
      await new Promise(resolve => setTimeout(resolve, 2000)); // simulate network delay
      
      const mockResult = {
        score: 85,
        summary: "The candidate has a strong background in software engineering, demonstrating solid experience with React, Node.js, and general web development. However, they lack some specific cloud deployment experience requested in the job description.",
        strengths: [
          "Extensive experience with React and modern frontend frameworks.",
          "Strong understanding of RESTful APIs and backend integration.",
          "Good educational background with a degree in Computer Science."
        ],
        weaknesses: [
          "Limited hands-on experience with AWS or Azure cloud deployments.",
          "No mention of CI/CD pipeline configuration experience."
        ],
        recommendations: [
          "Consider asking the candidate about their familiarity with CI/CD tools during the interview.",
          "Provide training or a probationary period focused on cloud infrastructure if hired."
        ]
      };
      
      return NextResponse.json({ 
        result: mockResult, 
        isMock: true, 
        message: "No GEMINI_API_KEY found in environment. Using mock response." 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert HR recruiter and Technical Resume Analyzer.
      I will provide you with a candidate's resume text and optionally a job description.
      Analyze the resume against the job description (if provided) and provide a detailed analysis.
      
      Respond STRICTLY in the following JSON format without any markdown wrappers or additional text:
      {
        "score": <number from 0 to 100 representing the overall fit>,
        "summary": "<a 2-3 sentence summary of the candidate's profile and fit>",
        "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
        "weaknesses": ["<weakness 1>", "<weakness 2>"],
        "recommendations": ["<recommendation 1>", "<recommendation 2>"]
      }

      Job Description:
      ${jobDescription || "Not provided (evaluate purely on general software engineering/professional best practices)"}

      Resume Information:
      ${resumeText || "Attached as file"}
    `;

    const parts: any[] = [
      { text: prompt }
    ];

    if (fileData) {
      parts.push({
        inlineData: {
          data: fileData.base64,
          mimeType: fileData.mimeType
        }
      });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    
    // Clean up response if it contains markdown code blocks
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("\`\`\`json")) {
      cleanedText = cleanedText.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
    } else if (cleanedText.startsWith("\`\`\`")) {
      cleanedText = cleanedText.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
    }

    const jsonResponse = JSON.parse(cleanedText);

    return NextResponse.json({ result: jsonResponse, isMock: false });
  } catch (error: unknown) {
    console.error("Resume analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze resume";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
