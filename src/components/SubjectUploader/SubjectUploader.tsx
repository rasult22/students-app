import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Link, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import styles from './SubjectUploader.module.css';

export type SourceType = 'text' | 'pdf' | 'url';

export interface UploadedContent {
  type: SourceType;
  content: string | File;
  name: string;
}

interface SubjectUploaderProps {
  onSubmit: (courseName: string, content: UploadedContent) => void;
  isLoading?: boolean;
  progress?: string;
  error?: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_TEXT_LENGTH = 100000;

export function SubjectUploader({
  onSubmit,
  isLoading = false,
  progress,
  error,
}: SubjectUploaderProps) {
  const [activeTab, setActiveTab] = useState<SourceType>('text');
  const [courseName, setCourseName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: SourceType; label: string; icon: React.ReactNode }[] = [
    { id: 'text', label: 'Текст', icon: <FileText size={18} /> },
    { id: 'pdf', label: 'PDF', icon: <Upload size={18} /> },
    { id: 'url', label: 'Ссылка', icon: <Link size={18} /> },
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    setValidationError('');

    if (!file.type.includes('pdf')) {
      setValidationError('Пожалуйста, загрузите PDF файл');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError('Файл слишком большой. Максимум 20MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    setValidationError('');

    if (!courseName.trim()) {
      setValidationError('Введите название курса');
      return false;
    }

    if (activeTab === 'text') {
      if (!textContent.trim()) {
        setValidationError('Введите учебный материал');
        return false;
      }
      if (textContent.length > MAX_TEXT_LENGTH) {
        setValidationError(`Текст слишком длинный. Максимум ${MAX_TEXT_LENGTH} символов`);
        return false;
      }
    }

    if (activeTab === 'pdf') {
      if (!selectedFile) {
        setValidationError('Загрузите PDF файл');
        return false;
      }
    }

    if (activeTab === 'url') {
      if (!urlContent.trim()) {
        setValidationError('Введите URL');
        return false;
      }
      try {
        new URL(urlContent);
      } catch {
        setValidationError('Некорректный URL');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    let content: UploadedContent;

    switch (activeTab) {
      case 'text':
        content = {
          type: 'text',
          content: textContent,
          name: 'Текстовый материал',
        };
        break;
      case 'pdf':
        content = {
          type: 'pdf',
          content: selectedFile!,
          name: selectedFile!.name,
        };
        break;
      case 'url':
        content = {
          type: 'url',
          content: urlContent,
          name: urlContent,
        };
        break;
    }

    onSubmit(courseName.trim(), content);
  };

  return (
    <div className={styles.uploader}>
      {/* Course name input */}
      <div className={styles.nameSection}>
        <Input
          label="Название курса"
          placeholder="Например: Основы машинного обучения"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Source tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
            disabled={isLoading}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={styles.contentArea}
        >
          {activeTab === 'text' && (
            <div className={styles.textInput}>
              <label className={styles.label}>Учебный материал</label>
              <textarea
                className={styles.textarea}
                placeholder="Вставьте текст учебника, конспекта или статьи..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={isLoading}
                rows={10}
              />
              <span className={styles.charCount}>
                {textContent.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
              </span>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div
              className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''} ${selectedFile ? styles.hasFile : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className={styles.fileInput}
                disabled={isLoading}
              />

              {selectedFile ? (
                <div className={styles.selectedFile}>
                  <FileText size={32} className={styles.fileIcon} />
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{selectedFile.name}</span>
                    <span className={styles.fileSize}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    className={styles.removeFile}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    disabled={isLoading}
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className={styles.dropPrompt}>
                  <Upload size={48} className={styles.uploadIcon} />
                  <p className={styles.dropText}>
                    Перетащите PDF файл сюда или нажмите для выбора
                  </p>
                  <p className={styles.dropHint}>Максимум 20MB, до 20 страниц</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div className={styles.urlInput}>
              <Input
                label="URL веб-страницы"
                placeholder="https://example.com/article"
                value={urlContent}
                onChange={(e) => setUrlContent(e.target.value)}
                disabled={isLoading}
              />
              <p className={styles.urlHint}>
                Введите ссылку на статью, документацию или учебные материалы
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error display */}
      {(validationError || error) && (
        <Card variant="outline" className={styles.errorCard}>
          <AlertCircle size={20} />
          <span>{validationError || error}</span>
        </Card>
      )}

      {/* Progress display */}
      {isLoading && progress && (
        <Card variant="outline" className={styles.progressCard}>
          <Loader2 size={20} className={styles.spinner} />
          <span>{progress}</span>
        </Card>
      )}

      {/* Submit button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleSubmit}
        loading={isLoading}
        disabled={isLoading}
      >
        Создать курс
      </Button>
    </div>
  );
}
