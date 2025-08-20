
import React, { useState, useRef, ChangeEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { BrainCircuitIcon, UploadIcon, SparklesIcon } from '../../assets/icons';
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai"; // Corrected imports

const HomeworkHelperPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [question, setQuestion] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiKey = typeof window !== 'undefined' ? (window as any).process?.env?.API_KEY : undefined;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("Gemini API key not found. AI features will be disabled.");
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 4 * 1024 * 1024) { 
        addToast({ type: 'error', message: 'Image file is too large. Max 4MB allowed.' });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleSubmit = async () => {
    if (!ai) {
        addToast({type: 'error', message: 'AI Homework Helper is currently unavailable.'});
        return;
    }
    if (!question.trim() && !imageFile) {
      addToast({ type: 'warning', message: 'Please enter a question or upload an image.' });
      return;
    }
    setIsLoading(true);
    setAiResponse('');

    const systemInstruction = "You are a friendly and encouraging Socratic tutor. Your goal is to help students understand concepts and solve problems themselves, not to provide direct answers. Ask guiding questions, break down problems, explain underlying concepts, and offer hints. If a student asks for a direct answer, gently refuse and steer them towards thinking about the problem. Be patient and supportive.";

    try {
      const parts: Part[] = [];
      if (question.trim()) {
        parts.push({ text: question });
      }
      if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        parts.push(imagePart);
      }
      
      const modelRequest = {
        model: 'gemini-2.5-flash-preview-04-17', 
        contents: { role: "user", parts }, // Ensure contents is structured as GenerateContentParameters
        config: { systemInstruction }
      };
      
      const result: GenerateContentResponse = await ai.models.generateContent(modelRequest); // Use GenerateContentResponse
      const responseText = result.text; // Access text property directly
      setAiResponse(responseText);

      // TODO: Log interaction to HomeworkHelperInteractions table via API
      // if (user) {
      //   await fetch(`${API_URL}/student/homework-helper-log`, {
      //     method: 'POST',
      //     headers: getAuthHeaders(),
      //     body: JSON.stringify({ studentUserId: user.id, promptText: question, promptImageUrl: imageFile ? 'uploaded' : null, aiResponse: responseText })
      //   });
      // }

    } catch (error: any) {
      console.error("AI Homework Helper error:", error);
      addToast({ type: 'error', message: error.message || 'Failed to get help from AI tutor.' });
      setAiResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <BrainCircuitIcon className="w-10 h-10 text-primary-600 dark:text-primary-400 mr-3" />
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text">AI Homework Helper</h1>
      </div>
      <p className="text-secondary-600 dark:text-secondary-300 mb-6">
        Stuck on a problem? Ask a question or upload an image of your homework, and our AI tutor will guide you.
        Remember, the AI will help you learn, not give you the answers directly!
      </p>

      <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="homeworkQuestion" className="block text-sm font-medium text-secondary-700 dark:text-secondary-200 mb-1">
            Your Question or Problem Description:
          </label>
          <textarea
            id="homeworkQuestion"
            rows={5}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here, e.g., 'Can you help me understand photosynthesis?' or 'I'm stuck on this algebra problem...'"
            className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-dark-text"
          />
        </div>

        <div>
          <label htmlFor="homeworkImage" className="block text-sm font-medium text-secondary-700 dark:text-secondary-200 mb-1">
            Upload an Image (Optional):
          </label>
          <Input
            id="homeworkImage"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            containerClassName="mb-0"
          />
          {imagePreview && (
            <div className="mt-4">
              <img src={imagePreview} alt="Homework problem preview" className="max-h-60 rounded-md border shadow-sm" />
              <Button variant="ghost" size="sm" onClick={() => { setImageFile(null); setImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = "";}} className="mt-2 text-xs">
                Clear Image
              </Button>
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={isLoading || (!question.trim() && !imageFile) || !ai} variant="primary" size="lg" leftIcon={<SparklesIcon className="w-5 h-5"/>}>
          {isLoading ? 'Getting Help...' : 'Get Help from AI Tutor'}
        </Button>
         {!ai && <p className="text-xs text-red-500 text-center">AI Helper is unavailable (API key may be missing).</p>}


        {aiResponse && (
          <div className="mt-8 p-4 border-t border-secondary-200 dark:border-dark-border">
            <h3 className="text-xl font-semibold text-secondary-700 dark:text-dark-text mb-3">AI Tutor's Response:</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-secondary-50 dark:bg-secondary-700 rounded-md shadow">
              {aiResponse.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkHelperPage;
