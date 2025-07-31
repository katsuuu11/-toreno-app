import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';
import { FaSave, FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { TbArrowBackUp } from 'react-icons/tb';
import { MdPhotoCamera } from 'react-icons/md';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingDate, setEditingDate] = useState(null);
  const [inputParts, setInputParts] = useState('');
  const [noteText, setNoteText] = useState('');
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: true }), // base64対応
    ],
    content: noteText,
    onUpdate: ({ editor }) => {
      setNoteText(editor.getHTML());
    },
  });

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };
  const [selectedColor, setSelectedColor] = useState('red');
  const [showColorOptions, setShowColorOptions] = useState(false);
  const [records, setRecords] = useState({});
  const [editBuffers, setEditBuffers] = useState(() => {
    const saved = localStorage.getItem('editBuffers');
    return saved ? JSON.parse(saved) : {};
  });
  const [mode, setMode] = useState('calendar');

  const colorOptions = [
    '#3498db',
    '#2ecc71',
    '#f39c12',
    '#8e44ad',
    '#16a085',
    '#d35400',
    '#34495e',
    '#7f8c8d',
  ];

  const handleDateClick = (date) => {
    const ymd = date.toISOString().split('T')[0];
    setSelectedDate(date);

    if (records[ymd] && records[ymd].length > 0) {
      setMode('view');
    } else {
      setEditingDate(date);
      const buffer = editBuffers[ymd] || {};
      setInputParts(buffer.part || '');
      setNoteText(buffer.note || '');
      setSelectedColor(buffer.color || 'red');
      setMode('form');
    }
  };

  const handleSave = () => {
    const ymd = editingDate.toISOString().split('T')[0];
    const newRecord = {
      part: inputParts,
      color: selectedColor,
      note: noteText,
    };

    setRecords((prev) => ({
      ...prev,
      [ymd]: [...(prev[ymd] || []), newRecord],
    }));

    setEditBuffers((prev) => {
      const copy = { ...prev };
      delete copy[ymd];
      return copy;
    });

    setMode('calendar');
    setInputParts('');
    setNoteText('');
    setSelectedColor('red');
    setShowColorOptions(false);
  };

  const handleDelete = (ymd, index) => {
    setRecords((prev) => {
      const updated = [...prev[ymd]];
      updated.splice(index, 1);
      if (updated.length === 0) {
        const copy = { ...prev };
        delete copy[ymd];
        return copy;
      }
      return {
        ...prev,
        [ymd]: updated,
      };
    });
  };

  // 🔁 編集中データをバッファに保存
  useEffect(() => {
    if (!editingDate) return;
    const ymd = editingDate.toISOString().split('T')[0];
    setEditBuffers((prev) => ({
      ...prev,
      [ymd]: {
        part: inputParts,
        note: noteText,
        color: selectedColor,
      },
    }));
  }, [inputParts, noteText, selectedColor, editingDate]);

  // 💾 バッファを localStorage に保存
  useEffect(() => {
    localStorage.setItem('editBuffers', JSON.stringify(editBuffers));
  }, [editBuffers]);

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '2rem 1rem',
        textAlign: 'left',
      }}
    >
      <h1
        style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '1rem' }}
      >
        トレノ
      </h1>

      <Calendar
        onClickDay={handleDateClick}
        value={selectedDate}
        tileClassName={({ date, view }) => {
          if (view === 'month') {
            const ymd = date.toISOString().split('T')[0];
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected =
              selectedDate.toDateString() === date.toDateString();
            const weekday = date.getDay();
            let classes = [];
            if (isToday && !isSelected) classes.push('today-tile');
            if (weekday === 0) classes.push('sunday');
            if (weekday === 6) classes.push('saturday');
            return classes.join(' ');
          }
          return null;
        }}
        tileContent={({ date, view }) => {
          if (view !== 'month') return null;
          const ymd = date.toISOString().split('T')[0];
          const dailyRecords = records[ymd];
          const isSelected =
            selectedDate.toDateString() === date.toDateString();
          const day = date.getDay();

          let baseColor = '#333';
          if (day === 0) baseColor = 'red';
          else if (day === 6) baseColor = '#3b82f6';

          const textColor =
            isSelected || dailyRecords?.length > 0 ? '#fff' : baseColor;

          if (dailyRecords?.length > 0) {
            return (
              <div
                style={{
                  backgroundColor: dailyRecords[0].color,
                  color: textColor,
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '0 auto',
                  fontWeight: 'bold',
                }}
              >
                {date.getDate()}
              </div>
            );
          }

          return (
            <div
              style={{
                textAlign: 'center',
                color: textColor,
                fontWeight: isSelected ? 'bold' : 'normal',
              }}
            >
              {date.getDate()}
            </div>
          );
        }}
      />

      <div style={{ marginTop: '2rem', minHeight: '400px' }}>
        {mode === 'form' && editingDate && (
          <div>
            <h2 style={{ textAlign: 'center' }}>
              {editingDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </h2>

            <label>
              <strong>部位</strong>
              <br />
              <input
                type="text"
                value={inputParts}
                onChange={(e) => setInputParts(e.target.value)}
                placeholder="例：胸・肩"
                style={{ width: '100%', fontSize: '1rem', padding: '0.5rem' }}
              />
            </label>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                margin: '1rem 0',
              }}
            >
              <div
                onClick={() => setShowColorOptions(!showColorOptions)}
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: selectedColor,
                  borderRadius: '50%',
                  border: '2px solid #000',
                  cursor: 'pointer',
                }}
              ></div>

              <div
                className={`color-options ${
                  showColorOptions ? 'show' : 'hide'
                }`}
                style={{ marginLeft: '1rem' }}
              >
                {colorOptions
                  .filter((color) => color !== selectedColor)
                  .map((color) => (
                    <div
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setShowColorOptions(false);
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: color,
                        border: '1px solid #ccc',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                  ))}
              </div>
            </div>

            <label className="record-label">
              <div className="record-label__header">
                <strong>記録</strong>

                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload" className="record-label__icon">
                  <MdPhotoCamera />
                </label>
              </div>

              <EditorContent editor={editor} />
            </label>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button onClick={handleSave} title="保存">
                <FaSave />
              </button>{' '}
              <button onClick={() => setMode('calendar')} title="戻る">
                <TbArrowBackUp />
              </button>
            </div>
          </div>
        )}

        {mode === 'view' && (
          <div>
            <h2>
              {selectedDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}{' '}
              の記録一覧
            </h2>

            {records[selectedDate.toISOString().split('T')[0]]?.map(
              (record, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #ccc',
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderLeft: `8px solid ${record.color}`,
                  }}
                >
                  <p>
                    <strong>{record.part}</strong>
                  </p>
                  <div
                    dangerouslySetInnerHTML={{ __html: record.note }}
                    style={{
                      fontSize: '1rem',
                      lineHeight: 1.6,
                    }}
                  />
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setInputParts(record.part);
                        setNoteText(record.note);
                        setSelectedColor(record.color);
                        setEditingDate(selectedDate);
                        handleDelete(
                          selectedDate.toISOString().split('T')[0],
                          index
                        );
                        setMode('form');
                      }}
                      title="編集"
                    >
                      <FaEdit />
                    </button>{' '}
                    <button
                      onClick={() =>
                        handleDelete(
                          selectedDate.toISOString().split('T')[0],
                          index
                        )
                      }
                      title="削除"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              )
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1rem',
              }}
            >
              <button
                onClick={() => {
                  setEditingDate(selectedDate);
                  setInputParts('');
                  setNoteText('');
                  setSelectedColor('red');
                  setMode('form');
                }}
                title="記録を追加"
              >
                <FaPlus />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
