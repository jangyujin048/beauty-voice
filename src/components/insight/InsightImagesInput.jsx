import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Check } from 'lucide-react';
import PrivateImage from '../media/PrivateMedia';
import { validateInsightImages } from './insightModel';
import './insight.css';
function Preview({ image }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!image.file) return;
    const next = URL.createObjectURL(image.file); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [image.file]);
  return <PrivateImage src={image.url || url || undefined} alt="첨부 사진 미리보기" />;
}
export default function InsightImagesInput({ images, onChange, disabled }) {
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const full = images.length >= 3;
  function add(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    const message = validateInsightImages(images, files);
    setError(message);
    if (!message) onChange([...images, ...files.map(file => ({ file, key: crypto.randomUUID() }))]);
  }
  return <div className="insight-images-input">
    <label htmlFor="insight-images">사진 ({images.length}/3)</label>
    <p className="sub">최대 3장 · 한 장당 10MB · 첫 번째 사진이 대표 이미지로 표시됩니다.</p>
    <input ref={fileInput} id="insight-images" type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled || full} onChange={add} />
    <button type="button" className="insight-photo-picker" disabled={disabled || full} onClick={() => fileInput.current?.click()}>
      <span className="insight-photo-picker-icon" aria-hidden="true">{full ? <Check size={22} /> : <ImagePlus size={22} />}</span>
      <span className="insight-photo-picker-copy">
        <strong>{full ? '사진 3장 첨부 완료' : '사진 추가하기'}</strong>
        <span>{full ? '사진을 바꾸려면 아래 미리보기에서 제거해주세요.' : `JPG · PNG · WebP · GIF / ${3 - images.length}장 더 추가할 수 있어요`}</span>
      </span>
    </button>
    {error && <p role="alert">{error}</p>}
    <div className="insight-upload-grid">{images.map((image, i) => <div key={image.key || image.url}>
      <Preview image={image} />
      <span>{i === 0 ? '대표 사진' : `사진 ${i + 1}`}</span>
      <button type="button" className="soft" disabled={disabled} onClick={() => { onChange(images.filter((_, index) => index !== i)); setError(''); }}>사진 {i + 1} 제거</button>
    </div>)}</div>
  </div>;
}
