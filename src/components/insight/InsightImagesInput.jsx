import React, { useEffect, useState } from 'react';
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
    <input id="insight-images" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled || images.length >= 3} onChange={add} />
    {error && <p role="alert">{error}</p>}
    <div className="insight-upload-grid">{images.map((image, i) => <div key={image.key || image.url}>
      <Preview image={image} />
      <span>{i === 0 ? '대표 사진' : `사진 ${i + 1}`}</span>
      <button type="button" className="soft" disabled={disabled} onClick={() => { onChange(images.filter((_, index) => index !== i)); setError(''); }}>사진 {i + 1} 제거</button>
    </div>)}</div>
  </div>;
}
