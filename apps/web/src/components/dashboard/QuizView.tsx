import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface Quiz {
  scenario: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizViewProps {
  quizzes: Quiz[];
  loading: boolean;
  onRegenerate: () => void;
}

export function QuizView({ quizzes, loading, onRegenerate }: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});

  // Reset selected options and index when quizzes change
  useEffect(() => {
    setSelectedOptions({});
    setCurrentIndex(0);
  }, [quizzes]);

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: '200px' }}>
        <RotateCw size={26} className="auth-spinner-icon" style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p>Regenerating quizzes from context...</p>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="error-state" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p className="error-title">No quizzes available</p>
        <button onClick={onRegenerate} className="home-btn" style={{ marginTop: '1rem' }}>
          Generate Quizzes
        </button>
      </div>
    );
  }

  const currentQuiz = quizzes[currentIndex];
  const selectedOption = selectedOptions[currentIndex] ?? null;

  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOption !== null) return; // Already answered
    setSelectedOptions(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Header Info & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>
            Quiz {currentIndex + 1} of {quizzes.length}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            ({Object.keys(selectedOptions).length} of {quizzes.length} answered)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Regenerate Button */}
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="home-btn"
            style={{
              margin: 0,
              padding: '0.4rem 0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              borderColor: 'var(--accent-dim)'
            }}
            title="Regenerate all quiz questions using AI"
          >
            <RotateCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Regenerate
          </button>

          {/* Stepper buttons */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="home-btn"
            style={{
              margin: 0,
              padding: '0.4rem 0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              opacity: currentIndex === 0 ? 0.4 : 1,
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === quizzes.length - 1}
            className="home-btn"
            style={{
              margin: 0,
              padding: '0.4rem 0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              opacity: currentIndex === quizzes.length - 1 ? 0.4 : 1,
              cursor: currentIndex === quizzes.length - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Quiz Area */}
      <div className="quiz-container">
        {currentQuiz.scenario && (
          <div className="quiz-scenario">{currentQuiz.scenario}</div>
        )}
        <p className="quiz-question">{currentQuiz.question}</p>
        
        <div className="quiz-options">
          {currentQuiz.options?.map((opt: string, i: number) => {
            const isCorrect = i === currentQuiz.correctIndex;
            const isSelected = i === selectedOption;
            let cls = 'quiz-option';
            
            if (selectedOption !== null) {
              if (isCorrect) cls += ' correct';
              else if (isSelected) cls += ' wrong';
            }
            
            return (
              <button
                key={i}
                className={cls}
                onClick={() => handleOptionSelect(i)}
                disabled={selectedOption !== null}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  width: '100%',
                  cursor: selectedOption !== null ? 'default' : 'pointer'
                }}
              >
                {selectedOption !== null && isCorrect && (
                  <CheckCircle2 size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                )}
                {selectedOption !== null && isSelected && !isCorrect && (
                  <AlertCircle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                )}
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {selectedOption !== null && (
          <div className="quiz-explanation" style={{ marginTop: '0.5rem' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {selectedOption === currentQuiz.correctIndex ? '✓ Correct!' : '✗ Incorrect'}
            </strong>
            <p style={{ margin: '0.25rem 0 0 0', lineHeight: 1.5 }}>{currentQuiz.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
