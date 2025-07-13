import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, platform } = await req.json();
  
  try {
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEKR1_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
       "model": "deepseek/deepseek-r1:free",
        messages: [{
          role: "user",
          content: generatePrompt(prompt, platform)
        }],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error:', data);
      return NextResponse.json({ 
        error: 'AI request failed',
        details: data.error?.message || `Status: ${response.status}`,
        modelUsed:"deepseek/deepseek-r1:free",
      }, { status: response.status });
    }

    if (data.choices?.[0]?.message?.content) {
      return NextResponse.json({ result: data.choices[0].message.content });
    } else {
      console.error('Unexpected response structure:', data);
      return NextResponse.json({ 
        error: 'Unexpected response from AI service',
        details: data
      }, { status: 500 });
    }
  } catch (error) {
    console.error('AI Processing Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generatePrompt(prompt: string, platform: string) {
  return `
  You are a social media expert. For the topic "${prompt}" and platform(s) ${platform || 'all major platforms'}, provide:
  
  1. 5-7 latest trending hashtags (include platform-specific trends if possible)
  2. 10 popular related hashtags
  3. 5 creative post ideas with platform-specific suggestions
  4. 1 bonus tip for improving engagement
  
  Format your response clearly with these exact section headers:
  
  [Trending Hashtags]
  [Related Hashtags]
  [Post Ideas]
  [Pro Tip]
  
  Make the suggestions practical, actionable, and platform-appropriate.`;
}