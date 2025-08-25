import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Eye,
  Edit3
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
  allowImages?: boolean;
  allowLinks?: boolean;
  allowTables?: boolean;
}

interface ToolbarButtonProps {
  icon: React.ElementType;
  title: string;
  command: string;
  isActive?: boolean;
  onClick?: () => void;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  icon: Icon, 
  title, 
  command, 
  isActive, 
  onClick 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      document.execCommand(command, false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      title={title}
      onClick={handleClick}
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-muted"
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  readOnly = false,
  className,
  minHeight = 200,
  allowImages = true,
  allowLinks = true,
  allowTables = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (editorRef.current && !readOnly) {
      editorRef.current.innerHTML = value;
      updateWordCount();
    }
  }, [value, readOnly]);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const updateWordCount = () => {
    if (editorRef.current) {
      const text = editorRef.current.textContent || '';
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  };

  const updateActiveFormats = () => {
    const formats = new Set<string>();
    
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('insertOrderedList')) formats.add('orderedList');
    if (document.queryCommandState('insertUnorderedList')) formats.add('unorderedList');
    
    setActiveFormats(formats);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      updateWordCount();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            document.execCommand('redo');
          } else {
            e.preventDefault();
            document.execCommand('undo');
          }
          break;
      }
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      document.execCommand('insertImage', false, url);
    }
  };

  const formatBlock = (tag: string) => {
    document.execCommand('formatBlock', false, tag);
  };

  const insertTable = () => {
    const rows = prompt('Number of rows:');
    const cols = prompt('Number of columns:');
    
    if (rows && cols) {
      const numRows = parseInt(rows);
      const numCols = parseInt(cols);
      
      if (numRows > 0 && numCols > 0) {
        let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
        
        for (let i = 0; i < numRows; i++) {
          tableHTML += '<tr>';
          for (let j = 0; j < numCols; j++) {
            tableHTML += '<td style="padding: 8px; border: 1px solid #ccc;">&nbsp;</td>';
          }
          tableHTML += '</tr>';
        }
        tableHTML += '</table>';
        
        document.execCommand('insertHTML', false, tableHTML);
      }
    }
  };

  const getEstimatedReadTime = () => {
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  if (readOnly || isPreviewMode) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          {!readOnly && (
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Preview</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(false)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          )}
          <div
            className="prose max-w-none"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: value }}
          />
          {wordCount > 0 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t text-xs text-muted-foreground">
              <span>{wordCount} words</span>
              <span>~{getEstimatedReadTime()} min read</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/20">
          {/* Text Formatting */}
          <ToolbarButton
            icon={Bold}
            title="Bold (Ctrl+B)"
            command="bold"
            isActive={activeFormats.has('bold')}
          />
          <ToolbarButton
            icon={Italic}
            title="Italic (Ctrl+I)"
            command="italic"
            isActive={activeFormats.has('italic')}
          />
          <ToolbarButton
            icon={Underline}
            title="Underline (Ctrl+U)"
            command="underline"
            isActive={activeFormats.has('underline')}
          />
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Headings */}
          <ToolbarButton
            icon={Heading1}
            title="Heading 1"
            command=""
            onClick={() => formatBlock('h1')}
          />
          <ToolbarButton
            icon={Heading2}
            title="Heading 2"
            command=""
            onClick={() => formatBlock('h2')}
          />
          <ToolbarButton
            icon={Heading3}
            title="Heading 3"
            command=""
            onClick={() => formatBlock('h3')}
          />
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Alignment */}
          <ToolbarButton
            icon={AlignLeft}
            title="Align Left"
            command="justifyLeft"
          />
          <ToolbarButton
            icon={AlignCenter}
            title="Align Center"
            command="justifyCenter"
          />
          <ToolbarButton
            icon={AlignRight}
            title="Align Right"
            command="justifyRight"
          />
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Lists */}
          <ToolbarButton
            icon={List}
            title="Bullet List"
            command="insertUnorderedList"
            isActive={activeFormats.has('unorderedList')}
          />
          <ToolbarButton
            icon={ListOrdered}
            title="Numbered List"
            command="insertOrderedList"
            isActive={activeFormats.has('orderedList')}
          />
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Special Elements */}
          <ToolbarButton
            icon={Quote}
            title="Quote"
            command=""
            onClick={() => formatBlock('blockquote')}
          />
          <ToolbarButton
            icon={Code}
            title="Code"
            command=""
            onClick={() => formatBlock('pre')}
          />
          
          {allowLinks && (
            <ToolbarButton
              icon={Link}
              title="Insert Link"
              command=""
              onClick={insertLink}
            />
          )}
          
          {allowImages && (
            <ToolbarButton
              icon={Image}
              title="Insert Image"
              command=""
              onClick={insertImage}
            />
          )}
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* History */}
          <ToolbarButton
            icon={Undo}
            title="Undo (Ctrl+Z)"
            command="undo"
          />
          <ToolbarButton
            icon={Redo}
            title="Redo (Ctrl+Shift+Z)"
            command="redo"
          />
          
          <div className="flex-1" />
          
          {/* Preview Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewMode(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
        
        {/* Editor Content */}
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className={cn(
            "p-4 outline-none focus:ring-0",
            "prose max-w-none",
            "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4",
            "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-3",
            "[&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2",
            "[&_p]:my-3",
            "[&_ul]:my-3 [&_ul]:pl-6",
            "[&_ol]:my-3 [&_ol]:pl-6",
            "[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic",
            "[&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-sm",
            "[&_table]:border-collapse [&_table]:w-full [&_table]:my-4",
            "[&_td]:border [&_td]:border-gray-300 [&_td]:p-2",
            "[&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-50 [&_th]:font-semibold",
            "[&_img]:max-w-full [&_img]:h-auto [&_img]:my-4",
            "[&_a]:text-blue-600 [&_a]:underline"
          )}
          style={{ minHeight }}
          data-placeholder={placeholder}
        />
        
        {/* Status Bar */}
        <div className="flex justify-between items-center px-4 py-2 bg-muted/20 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{wordCount} words</span>
            <span>~{getEstimatedReadTime()} min read</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Rich Text Editor</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// CSS for placeholder styling
const editorStyles = `
  [contenteditable][data-placeholder]:empty:before {
    content: attr(data-placeholder);
    color: #9ca3af;
    cursor: text;
  }
  
  [contenteditable]:focus {
    outline: none;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = editorStyles;
  document.head.appendChild(styleElement);
}
