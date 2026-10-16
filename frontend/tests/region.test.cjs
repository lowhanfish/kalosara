const {test}=require('node:test');const assert=require('node:assert/strict');
const {mapUrls,aggregateText,getRegion}=require('../.test-build/lib/region.js');
test('maps refuse missing/out-of-range coordinates and only construct OSM URLs, including zero coordinates',()=>{
 for(const pair of [[null,null],[undefined,1],[91,1],[1,181],[NaN,1],[1,Infinity],['1',1]])assert.equal(mapUrls(...pair),null);
 for(const pair of [[0,0],[-90,-180],[90,180],[-4,122]]){const urls=mapUrls(...pair);const url=new URL(urls.embed);assert.equal(url.origin,'https://www.openstreetmap.org');assert.equal(url.pathname,'/export/embed.html');const bbox=url.searchParams.get('bbox').split(',').map(Number);assert.ok(bbox.every(Number.isFinite));assert.ok(bbox[0]<bbox[2]&&bbox[1]<bbox[3]);}
});
test('unknown aggregate is not represented as zero',()=>{assert.equal(aggregateText(null),'Belum tersedia');assert.equal(aggregateText(undefined),'Belum tersedia');assert.equal(aggregateText(0),'0');assert.equal(aggregateText(1234),'1.234');});
test('region reads bypass caches and reject backend errors',async()=>{const old=global.fetch;try{let options;global.fetch=async(url,init)=>{options=init;return {ok:true,json:async()=>({success:true,data:{items:[],total:0,page:1,limit:10}})};};await getRegion('statistics');assert.equal(options.cache,'no-store');global.fetch=async()=>({ok:false});await assert.rejects(getRegion('statistics'));}finally{global.fetch=old;}});
