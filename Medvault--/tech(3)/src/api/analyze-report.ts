import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeReport(file: File) {
  try {
    // Convert the file to base64
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    // Call OpenAI's Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this medical report/scan. Provide a detailed analysis including: 1) Main diagnosis 2) Key findings 3) Recommendations. Format the response as JSON with fields: diagnosis, findings (array), and recommendations (array)."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No analysis results received');
    }

    // Parse the JSON response
    const analysis = JSON.parse(content);

    return {
      diagnosis: analysis.diagnosis,
      findings: analysis.findings,
      recommendations: analysis.recommendations,
    };
  } catch (error) {
    console.error('Error analyzing report:', error);
    throw error;
  }
}
