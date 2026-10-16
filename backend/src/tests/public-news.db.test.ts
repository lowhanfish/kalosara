import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { prisma } from '../lib/prisma.js';
import { createApp } from '../app.js';
const app=createApp(); const admin=request.agent(app);
const categoryId=randomUUID();const categorySlug=`public-category-${randomUUID()}`;const id=randomUUID();const otherId=randomUUID();
const firstSlug=`public-${randomUUID()}`;const secondSlug=`changed-${randomUUID()}`;const thirdSlug=`latest-${randomUUID()}`;
let userId:string;let headers:Record<string,string>;let version=0;
const fields=()=>({slug:firstSlug,title:'Berita publik uji',excerpt:'Ringkasan publik',bodyHtml:'<p>Konten resmi uji</p>',categoryId,coverId:null,status:'DRAFT',expectedVersion:version});
beforeAll(async()=>{
 const email=`public-${randomUUID()}@example.invalid`;const password=randomUUID()+'-Aa1!';
 const user=await prisma.user.create({data:{email,passwordHash:await hash(password,12),role:'ADMIN_KELURAHAN'}});userId=user.id;
 const csrf=(await admin.get('/api/v1/auth/csrf')).body.data.csrfToken;headers={Origin:'http://localhost:3000','X-CSRF-Token':csrf};
 await admin.post('/api/v1/auth/login').set(headers).send({email,password}).expect(200);
 await admin.put(`/api/v1/admin/news/categories/${categoryId}`).set(headers).send({name:'Kategori publik uji',slug:categorySlug,archived:false}).expect(200);
});
afterAll(async()=>{await prisma.news.deleteMany({where:{authorId:userId}});await prisma.newsCategory.deleteMany({where:{id:categoryId}});await prisma.cacheInvalidation.deleteMany();await prisma.user.delete({where:{id:userId}});await prisma.$disconnect();});
describe('public news publication contract',()=>{
 it('hides drafts from list, detail, category and sitemap while recording invalidation atomically',async()=>{
  const before=await prisma.cacheInvalidation.count();
  await admin.put(`/api/v1/admin/news/${id}`).set(headers).send(fields()).expect(200).then(r=>{version=r.body.data.news.version;expect(r.body.data.cacheInvalidated).toBe(false);});
  expect(await prisma.cacheInvalidation.count()).toBe(before+1);
  await request(app).get(`/api/v1/public/news/resolve/${firstSlug}`).expect(404);
  await request(app).get(`/api/v1/public/news/articles/${firstSlug}`).expect(404);
  await request(app).get(`/api/v1/public/news?search=${encodeURIComponent('Berita publik uji')}`).expect(200).then(r=>expect(r.body.data.total).toBe(0));
  await request(app).get(`/api/v1/public/news?category=${categorySlug}`).expect(404);
  await request(app).get('/api/v1/public/news/sitemap').expect(200).then(r=>expect(r.body.data.items.some((n:{slug:string})=>n.slug===firstSlug)).toBe(false));
 });
 it('publishes safe article data, listing, taxonomy, related articles and sitemap without user/private fields',async()=>{
  await admin.put(`/api/v1/admin/news/${id}`).set(headers).send({...fields(),status:'PUBLISHED'}).expect(200).then(r=>version=r.body.data.news.version);
  await admin.put(`/api/v1/admin/news/${otherId}`).set(headers).send({...fields(),slug:`related-${randomUUID()}`,status:'PUBLISHED',expectedVersion:0}).expect(200);
  await request(app).get(`/api/v1/public/news/resolve/${firstSlug}`).expect(200).then(r=>expect(r.body.data.slug).toBe(firstSlug));
  await request(app).get(`/api/v1/public/news/resolve-category/${categorySlug}`).expect(200);
  await request(app).get(`/api/v1/public/news/articles/${firstSlug}`).expect(200).then(r=>{expect(r.body.data.news.updatedAt).toBeTruthy();expect(r.body.data.related.length).toBe(1);expect(JSON.stringify(r.body)).not.toMatch(/passwordHash|authorId|editorId|ownerId|storageKey|email/);});
  await request(app).get(`/api/v1/public/news?category=${categorySlug}&limit=1&page=2`).expect(200).then(r=>{expect(r.body.data.total).toBe(2);expect(r.body.data.items.length).toBe(1);expect(r.body.data.category.name).toBe('Kategori publik uji');});
  await request(app).get('/api/v1/public/news/categories').expect(200).then(r=>expect(r.body.data.items.some((c:{slug:string})=>c.slug===categorySlug)).toBe(true));
  await request(app).get('/api/v1/public/news/sitemap').expect(200).then(r=>expect(r.body.data.items.some((n:{slug:string})=>n.slug===firstSlug)).toBe(true));
  await request(app).get('/api/v1/public/news?limit=500000').expect(400);
 });
 it('reserves old slugs, resolves aliases directly after multiple renames and keeps slug on content rollback',async()=>{
  const revisions=(await admin.get(`/api/v1/admin/news/${id}/revisions`)).body.data.items;const firstRevision=revisions.at(-1);
  await admin.put(`/api/v1/admin/news/${id}`).set(headers).send({...fields(),slug:secondSlug,status:'PUBLISHED'}).expect(200).then(r=>version=r.body.data.news.version);
  await admin.put(`/api/v1/admin/news/${id}`).set(headers).send({...fields(),slug:thirdSlug,status:'PUBLISHED'}).expect(200).then(r=>version=r.body.data.news.version);
  for(const slug of[firstSlug,secondSlug])await request(app).get(`/api/v1/public/news/redirect/${slug}`).expect(200).then(r=>expect(r.body.data.slug).toBe(thirdSlug));
  await admin.put(`/api/v1/admin/news/${randomUUID()}`).set(headers).send({...fields(),slug:firstSlug,expectedVersion:0}).expect(409);
  await admin.post(`/api/v1/admin/news/${id}/rollback`).set(headers).send({revisionId:firstRevision.id,expectedVersion:version}).expect(200).then(r=>{version=r.body.data.news.version;expect(r.body.data.news.slug).toBe(thirdSlug);expect(r.body.data.news.status).toBe('DRAFT');});
  await request(app).get(`/api/v1/public/news/redirect/${firstSlug}`).expect(404);
  await request(app).get(`/api/v1/public/news/articles/${thirdSlug}`).expect(404);
 });
 it('can reclaim its own old slug and hides archived targets and aliases immediately',async()=>{
  await admin.put(`/api/v1/admin/news/${id}`).set(headers).send({...fields(),slug:firstSlug,status:'PUBLISHED'}).expect(200).then(r=>version=r.body.data.news.version);
  await request(app).get(`/api/v1/public/news/redirect/${thirdSlug}`).expect(200).then(r=>expect(r.body.data.slug).toBe(firstSlug));
  await request(app).get(`/api/v1/public/news/redirect/${firstSlug}`).expect(404);
  const writes = await Promise.all(['A','B'].map(editor=>admin.put(`/api/v1/admin/news/${id}`).set(headers).send({...fields(),status:'PUBLISHED',title:`Editor ${editor}`})));
  expect(writes.map(r=>r.status).sort()).toEqual([200,409]);
  version = writes.find(r=>r.status===200)!.body.data.news.version;
  await admin.put(`/api/v1/admin/news/${id}`).set(headers).send({...fields(),status:'ARCHIVED'}).expect(200).then(r=>version=r.body.data.news.version);
  await request(app).get(`/api/v1/public/news/articles/${firstSlug}`).expect(404);await request(app).get(`/api/v1/public/news/redirect/${thirdSlug}`).expect(404);
  await request(app).get('/api/v1/public/news/sitemap').expect(200).then(r=>expect(r.body.data.items.some((n:{slug:string})=>n.slug===firstSlug)).toBe(false));
 });
});
