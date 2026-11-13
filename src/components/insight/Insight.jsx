import React, { useState } from 'react';
import { ChevronDown, ExternalLink, Image as ImageIcon } from 'lucide-react';
import PrivateImage, { PrivateMediaLink } from '../media/PrivateMedia';
import AdminModal from '../admin/AdminModal';
import { INSIGHT_STORES, insightImages } from './insightModel';
import { dateLabel } from '../../utils/date';
import './insight.css';

function InsightDetail({ item }) {
  const images = insightImages(item);
  const [index, setIndex] = useState(0);
  return <>
    <p className="sub">{INSIGHT_STORES.find(s => s.id === item.store_id)?.name || '기존 인사이트'} · {item.month} · {dateLabel(item.created_at)}</p>
    {images.length > 0 && <div className="insight-gallery">
      <PrivateMediaLink href={images[index]} target="_blank" rel="noopener noreferrer" aria-label={`사진 ${index + 1} 원본 보기 (새 탭)`}>
        <PrivateImage src={images[index]} alt={`${item.title} 사진 ${index + 1}`} />
      </PrivateMediaLink>
      {images.length > 1 && <div className="insight-thumbnails" aria-label="첨부 사진 선택">
        {images.map((url, i) => <button type="button" key={`${url}:${i}`} aria-label={`사진 ${i + 1} 보기`} aria-pressed={index === i} onClick={() => setIndex(i)}>
          <PrivateImage src={url} alt="" />
        </button>)}
        <span>{index + 1} / {images.length}</span>
      </div>}
    </div>}
    {item.content && <p className="insight-body">{item.content}</p>}
  </>;
}

export default function Insight({ insights, selectedInsight, setSelectedInsight }) {
  const [collapsed, setCollapsed] = useState(() => Object.fromEntries(INSIGHT_STORES.map(store => [store.id, true])));
  const sorted = [...insights].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latest = INSIGHT_STORES.map(store => ({ ...store, item: sorted.find(item => item.store_id === store.id) }));
  const featuredIds = new Set(latest.map(store => store.item?.id));
  const history = sorted.filter(item => !featuredIds.has(item.id));
  return <section className="panel insight-page">
    <header className="insight-header">
      <div><h2>BC 인사이트</h2><p className="sub">월간 만족도, VOC, 트렌드, 교육 이슈를 한눈에 확인하는 공간입니다.</p></div>
      <a className="insight-external" href="https://kitty-insight.vercel.app/" target="_blank" rel="noopener noreferrer">뷰티 맨션 성수 인사이트로 이동 <ExternalLink size={17} aria-hidden="true" /><span className="insight-sr-only"> (새 탭)</span></a>
    </header>
    <div className="insight-store-grid">
      {latest.map(store => {
        const images = insightImages(store.item);
        return <article className="insight-store-card" key={store.id}>
          <h3 className="insight-accordion-heading">
            <button type="button" className="insight-accordion-toggle"
              aria-expanded={!collapsed[store.id]} aria-controls={`insight-store-${store.id}`}
              onClick={() => setCollapsed(previous => ({ ...previous, [store.id]: !previous[store.id] }))}>
              <span>{store.name}<span>인사이트</span></span>
              <ChevronDown size={20} aria-hidden="true" />
            </button>
          </h3>
          <div id={`insight-store-${store.id}`} className="insight-accordion-body" hidden={Boolean(collapsed[store.id])}>
          {store.item ? <>
            <button type="button" className="insight-cover" onClick={() => setSelectedInsight(store.item)} aria-label={`${store.name}: ${store.item.title} 자세히 보기`}>
              {images.length ? <PrivateImage src={images[0]} alt={store.item.title} /> : <span className="insight-no-image"><ImageIcon size={36} />글로 만나는 인사이트</span>}
              {images.length > 1 && <span className="insight-image-count">+{images.length - 1}</span>}
            </button>
            <div className="insight-card-copy"><small>{store.item.month}</small><h4>{store.item.title}</h4>{store.item.content && <p>{store.item.content}</p>}</div>
            <button type="button" className="soft" onClick={() => setSelectedInsight(store.item)}>자세히 보기</button>
          </> : <div className="insight-no-image insight-empty"><ImageIcon size={36} /><p>등록된 인사이트가 없습니다.</p></div>}
          </div>
        </article>;
      })}
    </div>
    {history.length > 0 && <section className="insight-history">
      <h3>이전 인사이트</h3>
      <div>{history.map(item => <button className="card" type="button" key={item.id} onClick={() => setSelectedInsight(item)}>
        <small>{INSIGHT_STORES.find(s => s.id === item.store_id)?.name || '매장 미지정'} · {item.month}</small>
        <strong>{item.title}</strong><span>{dateLabel(item.created_at)}</span>
      </button>)}</div>
    </section>}
    <AdminModal open={Boolean(selectedInsight)} title={selectedInsight?.title || '인사이트'} onClose={() => setSelectedInsight(null)}>
      {selectedInsight && <InsightDetail key={selectedInsight.id} item={selectedInsight} />}
    </AdminModal>
  </section>;
}
