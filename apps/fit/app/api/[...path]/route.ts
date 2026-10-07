import {serverClient} from '@/lib/supabase-server';
export const dynamic='force-dynamic';
export const maxDuration=60;
async function handle(request:Request,{params}:{params:Promise<{path:string[]}>}){
 const client=await serverClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return Response.json({error:'Bitte melde dich an.'},{status:401});
 if(!['GET','HEAD'].includes(request.method)){
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Ungültiger Ursprung.'},{status:403});
 }
 const {data:{session}}=await client.auth.getSession();if(!session)return Response.json({error:'Sitzung abgelaufen.'},{status:401});
 const {path}=await params;const target=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL+'/functions/v1/fit-api/'+path.map(encodeURIComponent).join('/'));target.search=new URL(request.url).search;
 const headers:Record<string,string>={Authorization:'Bearer '+session.access_token,apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!};
 if(request.headers.get('content-type'))headers['Content-Type']=request.headers.get('content-type')!;
 try{const result=await fetch(target,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:await request.arrayBuffer(),cache:'no-store',redirect:'manual'});const out=new Headers({'Cache-Control':'private, no-store'});for(const key of ['content-type','location'])if(result.headers.has(key))out.set(key,result.headers.get(key)!);return new Response(result.body,{status:result.status,headers:out});}catch{return Response.json({error:'Verbindung zum Datenspeicher fehlgeschlagen. Bitte erneut versuchen.'},{status:503});}
}
export {handle as GET,handle as POST,handle as PATCH,handle as DELETE};
