
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { SparklesIcon } from '../../assets/icons'; 
import { GoogleGenAI, GenerateContentResponse } from "@google/genai"; // Corrected imports
import { LessonPlan } from '../../types'; 

const LessonPlannerPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [objectives, setObjectives] = useState('');
  const [duration, setDuration] = useState('45'); 
  const [keyConcepts, setKeyConcepts] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const apiKey = typeof window !== 'undefined' ? (window as any).process?.env?.API_KEY : undefined;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("Gemini API key not found. AI features will be disabled.");
  }

  const handleSubmit = async () => {
    if (!ai) {
        addToast({type: 'error', message: 'AI Lesson Planner is currently unavailable.'});
        return;
    }
    if (!topic || !gradeLevel || !objectives || !duration) {
      addToast({ type: 'warning', message: 'Please fill in Topic, Grade Level, Objectives, and Duration.' });
      return;
    }
    setIsLoading(true);
    setGeneratedPlan(null);

    const prompt = `
      Create a structured lesson plan for the following parameters:
      Topic: ${topic}
      Grade Level: ${gradeLevel}
      Learning Objectives: ${objectives}
      Lesson Duration: ${duration} minutes
      ${keyConcepts ? `Key Concepts to Cover: ${keyConcepts}` : ''}

      Please provide the lesson plan in JSON format with the following structure:
      {
        "title": "Lesson Plan: [Generated Title Based on Topic]",
        "subject": "[Inferred Subject or use Topic]",
        "gradeLevel": "${gradeLevel}",
        "durationMinutes": ${parseInt(duration)},
        "learningObjectives": "${objectives.replace(/\n/g, '\\n')}",
        "sections": [
          { "title": "Introduction (e.g., Hook, Review Previous Knowledge)", "content": "[Detailed content for introduction, including estimated time]" },
          { "title": "Main Activity 1 (e.g., Direct Instruction, Demonstration)", "content": "[Detailed content, including estimated time]" },
          { "title": "Main Activity 2 (e.g., Guided Practice, Group Work)", "content": "[Detailed content, including estimated time]" },
          { "title": "Main Activity 3 (e.g., Independent Practice, Application)", "content": "[Detailed content, including estimated time, make this optional if duration is short]" },
          { "title": "Materials & Resources Needed", "content": "[List of materials, textbooks, digital tools, etc.]" },
          { "title": "Assessment Methods (e.g., Formative questions, Exit ticket, Quiz)", "content": "[Description of assessment methods and how they link to objectives]" },
          { "title": "Differentiation/Extension Activities (Optional)", "content": "[Suggestions for students needing support or challenge. Be specific if possible.]" },
          { "title": "Conclusion & Wrap-up (e.g., Summary, Preview Next Lesson, Homework Assignment)", "content": "[Detailed content for conclusion, including estimated time]" }
        ]
      }
      Ensure the content for each section is detailed, practical, and actionable for a teacher. If the duration is short (e.g. 30 mins), provide fewer main activities. Ensure responseMimeType is application/json.
    `;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({ // Use GenerateContentResponse
        model: 'gemini-2.5-flash-preview-04-17', // Correct model
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      let jsonStr = response.text.trim(); // Access text directly
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      const parsedPlanData: Omit<LessonPlan, 'id' | 'teacherUserId' | 'createdAt' | 'updatedAt'> = JSON.parse(jsonStr);
      const completePlan: LessonPlan = {
          ...parsedPlanData,
          id: `plan-${Date.now()}`, 
          teacherUserId: user?.id || 'unknown_teacher',
          createdAt: new Date().toISOString(),
      };
      setGeneratedPlan(completePlan);
      addToast({ type: 'success', message: 'Lesson plan generated!' });

    } catch (error: any) {
      console.error("AI Lesson Plan generation error:", error);
      addToast({ type: 'error', message: error.message || 'Failed to generate lesson plan. The AI might have returned an unexpected format or encountered an issue.' });
      setGeneratedPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  const gradeLevelOptions = [
    {value: '', label: 'Select Grade Level'},
    ...Array.from({length: 12}, (_, i) => ({value: `Grade ${i+1}`, label: `Grade ${i+1}`})),
    {value: 'Kindergarten', label: 'Kindergarten'},
    {value: 'College - Year 1', label: 'College - Year 1'},
    {value: 'Adult Education', label: 'Adult Education'},
    {value: 'Other', label: 'Other (Specify in Topic/Objectives)'},
  ];
  
  const durationOptions = [
    {value: '30', label: '30 Minutes'}, {value: '45', label: '45 Minutes'},
    {value: '60', label: '60 Minutes'}, {value: '75', label: '75 Minutes'}, {value: '90', label: '90 Minutes'},
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <SparklesIcon className="w-10 h-10 text-primary-600 dark:text-primary-400 mr-3" />
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text">AI Lesson Plan Assistant</h1>
      </div>
      <p className="text-secondary-600 dark:text-secondary-300 mb-6">
        Get help crafting engaging lesson plans. Provide the details below and let AI assist you!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white dark:bg-dark-card shadow-xl rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text border-b pb-2 mb-3">Lesson Details</h2>
          <Input label="Topic / Subject" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Photosynthesis, Fractions" />
          <Select label="Grade Level" options={gradeLevelOptions} value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} />
          <Input label="Learning Objectives (one per line)" type="textarea" rows={4} value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="e.g., Students will be able to define photosynthesis." />
          <Select label="Lesson Duration" options={durationOptions} value={duration} onChange={(e) => setDuration(e.target.value)} />
          <Input label="Key Concepts (Optional, comma-separated)" value={keyConcepts} onChange={(e) => setKeyConcepts(e.target.value)} placeholder="e.g., chlorophyll, sunlight, glucose" />
          <Button onClick={handleSubmit} disabled={isLoading || !apiKey} variant="primary" size="lg" className="w-full mt-2" leftIcon={<SparklesIcon className="w-5 h-5"/>}>
            {isLoading ? 'Generating Plan...' : 'Generate Lesson Plan'}
          </Button>
           {!apiKey && <p className="text-xs text-red-500 mt-2 text-center">AI features are disabled. API key missing.</p>}
        </div>

        <div className="md:col-span-2 bg-white dark:bg-dark-card shadow-xl rounded-lg p-6">
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text border-b pb-2 mb-4">Generated Lesson Plan</h2>
          {isLoading && (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
              <p className="mt-4 text-secondary-600 dark:text-secondary-400">AI is thinking...</p>
            </div>
          )}
          {generatedPlan && !isLoading && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-300">{generatedPlan.title}</h3>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                Subject: {generatedPlan.subject} | Grade: {generatedPlan.gradeLevel} | Duration: {generatedPlan.durationMinutes} mins
              </p>
              <div className="prose prose-sm dark:prose-invert max-w-none"> 
                <h4>Learning Objectives:</h4>
                <ul className="list-disc pl-5">
                  {generatedPlan.learningObjectives.split('\n').map((obj, i) => obj.trim() && <li key={i}>{obj.trim()}</li>)}
                </ul>
                {generatedPlan.sections.map((section, index) => (
                  <div key={index} className="mt-3">
                    <h4 className="font-semibold text-md text-secondary-700 dark:text-dark-text">{section.title}</h4>
                    <div className="pl-2 text-secondary-600 dark:text-secondary-300 whitespace-pre-wrap">{section.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!generatedPlan && !isLoading && (
            <p className="text-center text-secondary-500 dark:text-secondary-400 py-10">Your generated lesson plan will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonPlannerPage;
