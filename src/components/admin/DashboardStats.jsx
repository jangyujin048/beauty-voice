export default function DashboardStats({stats}){

const cards=[
{title:"총 접수",value:stats.total},
{title:"오늘 접수",value:stats.today},
{title:"답변 완료",value:stats.done},
{title:"답변률",value:`${stats.replyRate}%`},
{title:"현재 조회",value:stats.filtered}
];

return(
<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",
gap:16,
marginBottom:24
}}>
{cards.map(card=>(
<div key={card.title}
style={{
background:"#fff",
border:"1px solid #e5e7eb",
borderRadius:16,
padding:20,
boxShadow:"0 2px 10px rgba(0,0,0,.05)"
}}>
<div style={{
fontSize:13,
color:"#6b7280",
marginBottom:8
}}>
{card.title}
</div>

<div style={{
fontSize:28,
fontWeight:700
}}>
{card.value}
</div>
</div>
))}
</div>
)

}
