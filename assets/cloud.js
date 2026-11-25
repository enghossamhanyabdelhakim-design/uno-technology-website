/* Minimal Supabase client for the admin panel: login, save content, upload images. */
(function(){
var c=window.UNO_CFG,K="uno_sess",S=null;
try{S=JSON.parse(localStorage.getItem(K)||"null")}catch(e){}
function store(s){S=s;try{if(s)localStorage.setItem(K,JSON.stringify(s));else localStorage.removeItem(K)}catch(e){}}
function j(r){return r.text().then(function(t){var d;try{d=JSON.parse(t)}catch(e){d=t}if(!r.ok)throw new Error((d&&(d.msg||d.message||d.error_description||d.error))||r.status);return d})}
function setSess(d){store({access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Math.floor(Date.now()/1000)+(d.expires_in||3600)-60,email:d.user&&d.user.email})}
function token(){
 if(!S)return Promise.reject(new Error("not logged in"));
 if(S.expires_at>Date.now()/1000)return Promise.resolve(S.access_token);
 return fetch(c.url+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{apikey:c.key,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:S.refresh_token})}).then(j).then(function(d){setSess(d);return S.access_token}).catch(function(e){store(null);throw e});
}
function H(t,extra){var h={apikey:c.key,Authorization:"Bearer "+t};for(var k in extra)h[k]=extra[k];return h}
window.CLOUD={token:token,
 loggedIn:function(){return !!S},
 email:function(){return S&&S.email},
 login:function(email,pw){return fetch(c.url+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:c.key,"Content-Type":"application/json"},body:JSON.stringify({email:email,password:pw})}).then(j).then(function(d){setSess(d);return d})},
 logout:function(){store(null)},
 check:function(){return token().then(function(t){return fetch(c.url+"/auth/v1/user",{headers:H(t)}).then(j)})},
 load:function(){return fetch(c.url+"/rest/v1/site_content?id=eq.1&select=data,updated_at",{headers:{apikey:c.key}}).then(j).then(function(r){return r&&r[0]||null})},
 save:function(data){return token().then(function(t){return fetch(c.url+"/rest/v1/site_content?on_conflict=id",{method:"POST",headers:H(t,{"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"}),body:JSON.stringify({id:1,data:data,updated_at:new Date().toISOString()})}).then(function(r){if(!r.ok)return j(r);return true})})},
 upload:function(blob,name){return token().then(function(t){var p=Date.now()+"-"+name.replace(/[^a-z0-9._-]/gi,"_");return fetch(c.url+"/storage/v1/object/site-media/"+p,{method:"POST",headers:H(t,{"Content-Type":blob.type||"application/octet-stream","x-upsert":"true"}),body:blob}).then(j).then(function(){return c.url+"/storage/v1/object/public/site-media/"+p})})}
};
})();
