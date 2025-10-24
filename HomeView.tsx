import React, { useState, useCallback, useEffect } from 'react';
import type { Course, RawQuestion, ProgressData } from '../types';
import { parseCSV, validateAndExtractQuestions } from '../lib/parser';

interface HomeViewProps {
  courses: Course[];
  progressData: ProgressData;
  onSelectCourse: (courseId: string) => void;
  onCreateCourse: (questions: RawQuestion[], title: string) => void;
  onGoToProfile: () => void;
}

// Field Mapping Component
const FieldMappingStep: React.FC<{
    headers: string[];
    sampleRows: Record<string, string>[];
    onConfirm: (mapping: Record<string, string>) => void;
    onCancel: () => void;
}> = ({ headers, sampleRows, onConfirm, onCancel }) => {
    const requiredFields = [
        'question_id', 'question_text', 'topic', 'study_unit_number', 'study_unit_name',
        'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'
    ];
    const optionalFields = ['explanation', 'difficulty', 'first_attempt_rate'];
    
    const [mapping, setMapping] = useState<Record<string, string>>({});

    useEffect(() => {
        const autoMap = (field: string, headers: string[]): string => {
            const normalize = (s: string) => s.replace(/[\s_-]/g, '').toLowerCase();
            const normalizedField = normalize(field);
            
            const aliases: Record<string, string[]> = {
                question_text: ['question', 'prompt', 'text'],
                study_unit_number: ['unit', 'unitnumber', 'unitno'],
                study_unit_name: ['unitname', 'unittitle'],
                correct_answer: ['correct', 'answer', 'correctoption'],
                option_a: ['optiona', 'choicea', 'a'],
                option_b: ['optionb', 'choiceb', 'b'],
                option_c: ['optionc', 'choicec', 'c'],
                option_d: ['optiond', 'choiced', 'd'],
                first_attempt_rate: ['successrate', 'firstattempt', 'rate']
            };

            // 1. Exact match (case-insensitive)
            let bestMatch = headers.find(h => normalize(h) === normalizedField);
            if (bestMatch) return bestMatch;

            // 2. Alias match
            const fieldAliases = aliases[field] || [];
            bestMatch = headers.find(h => fieldAliases.some(alias => normalize(h).includes(alias)));
            if (bestMatch) return bestMatch;
            
            // 3. Partial match
            bestMatch = headers.find(h => normalize(h).includes(normalizedField));
            if (bestMatch) return bestMatch;

            return '';
        };

        const initialMapping: Record<string, string> = {};
        [...requiredFields, ...optionalFields].forEach(field => {
            initialMapping[field] = autoMap(field, headers);
        });
        setMapping(initialMapping);
    }, [headers]);


    const handleMappingChange = (field: string, header: string) => {
        setMapping(prev => ({ ...prev, [field]: header }));
    };
    
    const isMappingComplete = requiredFields.every(field => mapping[field] && mapping[field] !== '');

    const renderFieldSelect = (field: string) => (
        <div key={field}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 capitalize mb-1">
                {field.replace(/_/g, ' ')}
            </label>
            <select
                value={mapping[field] || ''}
                onChange={(e) => handleMappingChange(field, e.target.value)}
                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2"
            >
                <option value="">Select column...</option>
                {headers.map(header => <option key={header} value={header}>{header}</option>)}
            </select>
        </div>
    );

    return (
        <div className="mt-6">
            <h3 className="font-semibold text-lg mb-4">Map CSV Fields</h3>
            
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                <h4 className="font-semibold mb-3">Required Fields</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requiredFields.map(renderFieldSelect)}
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                <h4 className="font-semibold mb-3">Optional Fields</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {optionalFields.map(renderFieldSelect)}
                </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Data Preview</p>
              <div className="overflow-x-auto bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-200 dark:bg-slate-700">
                    <tr>{headers.map(h => <th key={h} className="p-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row, i) => <tr key={i} className="border-b border-slate-200 dark:border-slate-700">{headers.map(h => <td key={h} className="p-2 truncate max-w-xs" title={row[h]}>{row[h]}</td>)}</tr>)}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
                <button onClick={onCancel} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                <button onClick={() => onConfirm(mapping)} disabled={!isMappingComplete} className="bg-[#20B2AA] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50">Confirm Mapping & Preview</button>
            </div>
        </div>
    );
};

const AddCourseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreateCourse: (questions: RawQuestion[], title: string) => void;
}> = ({ isOpen, onClose, onCreateCourse }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<{ units: number; topics: number; questions: number; } | null>(null);
    const [pendingQuestions, setPendingQuestions] = useState<RawQuestion[] | null>(null);
    const [url, setUrl] = useState('');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [courseTitle, setCourseTitle] = useState('');
    
    // CSV States
    const [uploadStep, setUploadStep] = useState<'select' | 'map' | 'preview'>('select');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvSampleRows, setCsvSampleRows] = useState<Record<string, string>[]>([]);
    const [pendingCsvRows, setPendingCsvRows] = useState<Record<string, string>[] | null>(null);


    const resetState = useCallback(() => {
        setIsDragging(false);
        setError(null);
        setPreview(null);
        setPendingQuestions(null);
        setUrl('');
        setIsLoadingUrl(false);
        setCourseTitle('');
        setUploadStep('select');
        setCsvHeaders([]);
        setCsvSampleRows([]);
        setPendingCsvRows(null);
    }, []);

    const handleClose = () => {
        resetState();
        onClose();
    };

    const processStructuredData = useCallback((questions: RawQuestion[]) => {
        setError(null);
        setPendingQuestions(questions);
        const unitSet = new Set<number>();
        const topicSet = new Set<string>();
        questions.forEach((q: RawQuestion) => {
            unitSet.add(q.study_unit.number);
            topicSet.add(`${q.study_unit.number}-${q.topic}`);
        });
        setPreview({
            units: unitSet.size,
            topics: topicSet.size,
            questions: questions.length,
        });
        setUploadStep('preview');
    }, [setPendingQuestions, setPreview, setUploadStep]);
    
    const transformCsvToQuestions = (rows: Record<string, string>[], mapping: Record<string, string>): RawQuestion[] => {
        return rows.filter(row => row[mapping['question_text']]).map((row, index) => {
            const question_id = row[mapping['question_id']] || `csv-${Date.now()}-${index}`;
            const difficultyStr = mapping['difficulty'] ? row[mapping['difficulty']] : undefined;
            const rateStr = mapping['first_attempt_rate'] ? row[mapping['first_attempt_rate']] : undefined;

            return {
                question_id,
                question_text: row[mapping['question_text']] || '',
                topic: row[mapping['topic']] || 'General',
                study_unit: {
                    number: parseInt(row[mapping['study_unit_number']], 10) || 1,
                    name: row[mapping['study_unit_name']] || `Unit ${parseInt(row[mapping['study_unit_number']], 10) || 1}`,
                },
                options: [
                    { id: 'A', text: row[mapping['option_a']] || '' },
                    { id: 'B', text: row[mapping['option_b']] || '' },
                    { id: 'C', text: row[mapping['option_c']] || '' },
                    { id: 'D', text: row[mapping['option_d']] || '' },
                ],
                correct_answer: row[mapping['correct_answer']]?.toUpperCase() || '',
                explanation: mapping['explanation'] ? row[mapping['explanation']] : undefined,
                difficulty: difficultyStr ? parseInt(difficultyStr, 10) : undefined,
                first_attempt_rate: rateStr ? parseFloat(rateStr) : undefined,
            };
        });
    };
    
    const handleConfirmMapping = (mapping: Record<string, string>) => {
        if (!pendingCsvRows) return;
        try {
            const questions = transformCsvToQuestions(pendingCsvRows, mapping);
            if(questions.length === 0) throw new Error("No valid questions could be processed from the CSV.");
            processStructuredData(questions);
        } catch (err: any) {
            setError(err.message || 'Failed to process CSV data.');
        }
    };

    const processFile = useCallback((file: File) => {
        resetState(); // Ensure clean state for every new file
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result !== 'string') throw new Error("Could not read file");
                
                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    const jsonData = JSON.parse(result);
                    const questions = validateAndExtractQuestions(jsonData);
                    processStructuredData(questions);
                } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                    const { headers, rows } = parseCSV(result);
                    if (rows.length === 0) throw new Error("CSV file is empty or improperly formatted.");
                    setCsvHeaders(headers);
                    setPendingCsvRows(rows);
                    setCsvSampleRows(rows.slice(0, 3));
                    setUploadStep('map');
                    setError(null);
                } else {
                     setError('Invalid file type. Please upload a JSON or CSV file.');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to parse file.');
                resetState();
            }
        };
        reader.onerror = () => {
             setError("Error reading file.");
             resetState();
        };
        reader.readAsText(file);
    }, [resetState, processStructuredData]);

    const handleImportFromUrl = async () => {
        if (!url) {
            setError('Please enter a valid URL.');
            return;
        }
        setIsLoadingUrl(true);
        setError(null);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
            const jsonData = await response.json();
            const questions = validateAndExtractQuestions(jsonData);
            processStructuredData(questions);
            setUrl('');
        } catch (err: any) {
            setError(err.message || 'Failed to import from URL.');
        } finally {
            setIsLoadingUrl(false);
        }
    };
    
    const handleCreate = () => {
        if (pendingQuestions && courseTitle) {
            onCreateCourse(pendingQuestions, courseTitle);
            handleClose();
        }
    };

    const generateCSVTemplate = (): string => {
        const headers = [
            'question_id', 'question_text', 'topic', 'study_unit_number', 'study_unit_name',
            'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer',
            'explanation', 'difficulty', 'first_attempt_rate'
        ];
        const sampleRow = [
            'TAX101', '"What is the standard deduction for a single individual in 2023?"', 'Deductions', '1', 'Filing Basics',
            '"$13,850"', '"$27,700"', '"$20,800"', '"A percentage of your income"', 'A',
            '"The standard deduction is a specific dollar amount that reduces your taxable income. For 2023, it\'s $13,850 for single filers."', '2', '65'
        ];
        
        const csvContent = [
            headers.join(','),
            sampleRow.map(field => `"${field.replace(/"/g, '""')}"`).join(',') // Quote all fields and escape internal quotes
        ].join('\n');
        
        return csvContent;
    };

    const handleDownloadTemplate = () => {
        const csvString = generateCSVTemplate();
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'eazy-learn-template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 border border-slate-200 dark:border-slate-700 w-full max-w-3xl m-4 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold">Add New Subject</h2>
                    <button onClick={handleClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-3xl">&times;</button>
                </div>
                
                <div className="overflow-y-auto pr-2 -mr-2">
                    {uploadStep === 'select' && (
                        <>
                            <div onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                                 onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                                 onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                 onDrop={(e) => {
                                     e.preventDefault();
                                     e.stopPropagation();
                                     setIsDragging(false);
                                     if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
                                 }}
                                 className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-[#20B2AA] bg-green-50 dark:bg-green-900/20' : 'border-slate-300 dark:border-slate-600'}`}>
                                <p>Drag & drop JSON or CSV file here or</p>
                                <input type="file" id="file-input-modal" accept=".json,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
                                <button type="button" className="mt-2 bg-slate-200 dark:bg-slate-700 font-semibold py-2 px-4 rounded-lg" onClick={() => document.getElementById('file-input-modal')?.click()}>Choose File</button>
                                <div className="text-center mt-4">
                                    <button onClick={handleDownloadTemplate} className="text-sm text-[#20B2AA] hover:underline font-semibold">
                                        Download CSV Template
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Or paste public JSON URL..." className="flex-grow w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2" />
                                <button onClick={handleImportFromUrl} disabled={isLoadingUrl} className="bg-[#20B2AA] text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50">
                                    {isLoadingUrl ? 'Importing...' : 'Import'}
                                </button>
                            </div>
                        </>
                    )}
                    
                    {uploadStep === 'map' && (
                        <FieldMappingStep headers={csvHeaders} sampleRows={csvSampleRows} onConfirm={handleConfirmMapping} onCancel={resetState} />
                    )}

                    {error && <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">{error}</div>}

                    {uploadStep === 'preview' && preview && pendingQuestions && (
                        <div className="mt-6 space-y-4">
                             <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <h3 className="font-semibold text-green-800 dark:text-green-200">📊 File Preview</h3>
                                <div className="flex justify-around text-center mt-2">
                                    <span>{preview.units} Units</span>
                                    <span>{preview.topics} Topics</span>
                                    <span>{preview.questions} Questions</span>
                                </div>
                             </div>
                            <input type="text" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="Enter Subject Name (e.g., Biology 101)" className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3" />
                            <button onClick={handleCreate} disabled={!courseTitle} className="w-full bg-[#20B2AA] text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                              Create Subject
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const HomeView: React.FC<HomeViewProps> = ({ courses, progressData, onSelectCourse, onCreateCourse, onGoToProfile }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const colorAccents = ['border-l-blue-500', 'border-l-green-500', 'border-l-yellow-500', 'border-l-purple-500', 'border-l-pink-500', 'border-l-orange-500'];

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <header className="relative flex justify-between items-center py-8">
        <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">My Subjects</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">Your personal learning dashboard.</p>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setIsModalOpen(true)} className="bg-[#20B2AA] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">
                + Add New Subject
            </button>
            <button onClick={onGoToProfile} className="bg-white dark:bg-slate-700 p-2 rounded-full shadow-md hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </button>
        </div>
      </header>

      <AddCourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreateCourse={onCreateCourse} />
      
      <section>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => {
                const progress = progressData[course.courseId];
                const totalTopics = course.units.reduce((sum, unit) => sum + unit.topics.length, 0);
                const completion = progress && totalTopics > 0 ? Math.round((progress.completedTopics.length / totalTopics) * 100) : 0;
                const accentColor = colorAccents[index % colorAccents.length];

              return (
                <div key={course.courseId} onClick={() => onSelectCourse(course.courseId)} className={`bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 ${accentColor} border-l-4`}>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{course.courseTitle}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Total XP: {progress?.totalXP || 0}</p>
                    </div>
                    <div className="px-6 pb-6">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="bg-[#20B2AA] h-2 rounded-full" style={{ width: `${completion}%` }}></div>
                        </div>
                        <p className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1">{completion}% Complete</p>
                    </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-dashed border-slate-300 dark:border-slate-700">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">Welcome to EAIZY Learn!</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Add your first subject to get started.</p>
            <button onClick={() => setIsModalOpen(true)} className="bg-[#20B2AA] text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition">
                Add Your First Subject
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeView;