"use client";

import { useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { cleanPdfText } from '@/utils/atividades/textUtils';
import { imageToBase64 } from '@/utils/atividades/storageUtils';

const ToolbarBtn = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className={`w-7 h-7 flex items-center justify-center rounded text-xs font-semibold transition-colors ${
      active ? 'bg-[#DAEBE5] text-[#0B5F59]' : 'text-[#566F65] hover:bg-[#F3F7F5] hover:text-[#123C3A]'
    }`}
  >
    {children}
  </button>
);

async function insertImageFile(file, editorRef) {
  if (!file || !editorRef.current) return;
  const base64 = await imageToBase64(file, 1200, 0.8);
  editorRef.current.chain().focus().setImage({ src: base64 }).run();
}

export function RichTextEditor({ value, onChange, placeholder, rows = 6 }) {
  const editorRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, blockquote: false, code: false, horizontalRule: false }),
      Underline,
      Image.configure({ allowBase64: true, inline: false }),
    ],
    content: value || '',
    onCreate: ({ editor }) => { editorRef.current = editor; },
    onUpdate: ({ editor }) => { editorRef.current = editor; onChange(editor.getHTML()); },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[' + (rows * 1.6) + 'rem] prose prose-sm max-w-none text-sm text-[#123C3A] leading-relaxed',
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) { insertImageFile(file, editorRef); return true; }
        }

        const richHtml = event.clipboardData?.getData('text/html') || '';
        const isTrulyRich = richHtml && (
          richHtml.includes('docs-internal-guid') ||   
          richHtml.includes('mso-') ||                  
          richHtml.includes('urn:schemas-microsoft') || 
          richHtml.includes('xmlns:o=')                 
        );
        if (isTrulyRich) return false;

        const plain = event.clipboardData?.getData('text/plain');
        if (!plain) return false;
        const cleaned = cleanPdfText(plain);
        const insertHtml = cleaned.split('\n\n').map(p => `<p>${p}</p>`).join('');
        if (editorRef.current) {
          editorRef.current.chain().insertContent(insertHtml).run();
          return true;
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const imgFile = files.find(f => f.type.startsWith('image/'));
        if (imgFile) { event.preventDefault(); insertImageFile(imgFile, editorRef); return true; }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && value && editor.isEmpty) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]); 

  if (!editor) return null;

  const groups = [
    [
      { label: 'N', title: 'Negrito', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
      { label: 'I', title: 'Itálico', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), italic: true },
      { label: 'S', title: 'Sublinhado', action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), underline: true },
      { label: 'R', title: 'Tachado', action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), strike: true },
    ],
    [
      { label: 'H1', title: 'Título 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
      { label: 'H2', title: 'Título 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
      { label: 'H3', title: 'Título 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
    ],
    [
      { label: '≡', title: 'Lista com marcadores', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
      { label: '1.', title: 'Lista numerada', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    ],
  ];

  return (
    <div className="border border-[#D5E3DC] rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-[#0F766E]/50 focus-within:border-transparent transition-all bg-white">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#D5E3DC] bg-[#F3F8F5] flex-wrap">
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <div className="w-px h-4 bg-[#D5E3DC] mx-1" />}
            {group.map((btn) => (
              <ToolbarBtn key={btn.label} onClick={btn.action} active={btn.active} title={btn.title}>
                <span className={`${btn.italic ? 'italic' : ''} ${btn.underline ? 'underline' : ''} ${btn.strike ? 'line-through' : ''}`}>
                  {btn.label}
                </span>
              </ToolbarBtn>
            ))}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-0.5">
          <label title="Inserir imagem" className="w-7 h-7 flex items-center justify-center rounded cursor-pointer text-[#566F65] hover:bg-[#F3F7F5] hover:text-[#123C3A] transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) insertImageFile(file, editorRef);
              e.target.value = '';
            }} />
          </label>
          <ToolbarBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Limpar formatação">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 20H7L3 16l10-10 7 7-1.5 1.5"/><path d="M6.5 17.5l5-5"/>
            </svg>
          </ToolbarBtn>
        </div>
      </div>

      <div className="px-3 py-2.5 bg-[#F3F8F5] focus-within:bg-white transition-colors">
        {!editor.getText() && !editor.isFocused && (
          <p className="absolute text-sm text-slate-400 pointer-events-none select-none">{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
